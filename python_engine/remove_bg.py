"""
Background Removal Engine
Wraps rembg with U2-Net / U2-Net Portable model.
Supports stdin/stdout piping for zero disk I/O, preserving complete user privacy.
"""

import sys
import io
import argparse
from PIL import Image, ImageOps
import rembg

_SESSION = None

def get_session(model_name="u2netp"):
    global _SESSION
    if _SESSION is None:
        _SESSION = rembg.new_session(model_name)
    return _SESSION

def process_image(image_bytes: bytes, model_name: str = "u2netp") -> bytes:
    # 1. Open image from in-memory bytes
    input_image = Image.open(io.BytesIO(image_bytes))

    # 2. Fix EXIF orientation (crucial for mobile camera uploads)
    input_image = ImageOps.exif_transpose(input_image)

    # Convert to RGB if needed (handles CMYK, palette modes)
    if input_image.mode not in ("RGB", "RGBA"):
        input_image = input_image.convert("RGB")

    # 3. Get cached session and remove background
    session = get_session(model_name)
    result_image = rembg.remove(
        input_image,
        session=session,
        alpha_matting=False,
        post_process_mask=True
    )

    # 4. Save to in-memory PNG buffer
    output_buffer = io.BytesIO()
    result_image.save(output_buffer, format="PNG", optimize=True)
    return output_buffer.getvalue()

def main():
    parser = argparse.ArgumentParser(description="Image Background Removal CLI")
    parser.add_argument("--model", default="u2netp", help="Model name (u2netp, u2net, etc.)")
    parser.add_argument("--input", help="Input file path")
    parser.add_argument("--output", help="Output file path")
    parser.add_argument("--pipe", action="store_true", help="Read from stdin, write to stdout")
    args = parser.parse_args()

    try:
        if args.pipe:
            raw_input = sys.stdin.buffer.read()
            if not raw_input:
                sys.stderr.write("Error: Empty input stream\n")
                sys.exit(1)
            output_png = process_image(raw_input, model_name=args.model)
            sys.stdout.buffer.write(output_png)
            sys.stdout.buffer.flush()
        elif args.input and args.output:
            with open(args.input, "rb") as f:
                raw_input = f.read()
            output_png = process_image(raw_input, model_name=args.model)
            with open(args.output, "wb") as f:
                f.write(output_png)
            print("OK")
        else:
            sys.stderr.write("Usage: python remove_bg.py --pipe OR --input <in> --output <out>\n")
            sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Processing error: {str(e)}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
