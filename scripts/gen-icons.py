#!/usr/bin/env python
"""Generate Gym House PWA PNG icons (no external deps — stdlib zlib/struct only)."""
import os
import struct
import zlib

BG = (0x0B, 0x0E, 0x12)      # dark ink
EMBER = (0xE2, 0x59, 0x3A)   # accent
CHALK = (0xEE, 0xF1, 0xF5)

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static', 'icons')


def write_png(path, w, h, rgba):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)  # filter: none
        raw.extend(rgba[y * stride:(y + 1) * stride])

    def chunk(typ, data):
        return (struct.pack('>I', len(data)) + typ + data +
                struct.pack('>I', zlib.crc32(typ + data) & 0xFFFFFFFF))

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(raw), 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def in_rect(x, y, x0, y0, x1, y1):
    return x0 <= x <= x1 and y0 <= y <= y1


def color_at(nx, ny):
    """nx, ny normalized 0..1. Returns RGBA tuple."""
    # Dumbbell: centre bar + inner plates + outer plates
    bar = in_rect(nx, ny, 0.30, 0.465, 0.70, 0.535)
    inner_l = in_rect(nx, ny, 0.235, 0.33, 0.30, 0.67)
    inner_r = in_rect(nx, ny, 0.70, 0.33, 0.765, 0.67)
    outer_l = in_rect(nx, ny, 0.175, 0.395, 0.235, 0.605)
    outer_r = in_rect(nx, ny, 0.765, 0.395, 0.825, 0.605)

    if bar or inner_l or inner_r:
        return EMBER + (255,)
    if outer_l or outer_r:
        return CHALK + (255,)
    return BG + (255,)


def render(size, ss=4):
    hi = size * ss
    buf = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r = g = b = a = 0
            for dy in range(ss):
                for dx in range(ss):
                    px = (x * ss + dx + 0.5) / hi
                    py = (y * ss + dy + 0.5) / hi
                    cr, cg, cb, ca = color_at(px, py)
                    r += cr; g += cg; b += cb; a += ca
            n = ss * ss
            i = (y * size + x) * 4
            buf[i] = r // n
            buf[i + 1] = g // n
            buf[i + 2] = b // n
            buf[i + 3] = a // n
    return buf


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in (192, 512):
        path = os.path.join(OUT_DIR, f'icon-{size}.png')
        write_png(path, size, size, render(size))
        print(f'wrote {os.path.normpath(path)} ({os.path.getsize(path)} bytes)')


if __name__ == '__main__':
    main()
