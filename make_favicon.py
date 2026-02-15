from PIL import Image, ImageFilter
import numpy as np

INPUT_FILE = "ezfix-logo.jpeg"
OUTPUT_PNG_32 = "favicon_32x32.png"
OUTPUT_ICO = "favicon.ico"

def remove_white_background(img, threshold=245):
    img = img.convert("RGBA")
    data = np.array(img)

    r, g, b, a = data.T
    white = (r > threshold) & (g > threshold) & (b > threshold)

    data[..., 3][white.T] = 0
    return Image.fromarray(data)

def crop_to_content(img):
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

def resize_and_sharpen(img, size):
    img = img.resize((size, size), Image.LANCZOS)
    return img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))

def main():
    img = Image.open(INPUT_FILE)

    # Remove background
    img = remove_white_background(img)

    # Crop tightly
    img = crop_to_content(img)

    # Create favicon sizes
    img_32 = resize_and_sharpen(img, 32)
    img_16 = resize_and_sharpen(img, 16)

    # Save PNG
    img_32.save(OUTPUT_PNG_32, format="PNG")

    # Save ICO (multi-size)
    img_32.save(
        OUTPUT_ICO,
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[img_16]
    )

    print("✔ Favicon exported:")
    print(" - favicon_32x32.png")
    print(" - favicon.ico (16x16, 32x32)")

if __name__ == "__main__":
    main()
