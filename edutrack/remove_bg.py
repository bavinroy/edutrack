from PIL import Image, ImageDraw

def remove_bg():
    input_path = "static/img/logo.jpg"
    output_path = "static/img/logo.png"
    
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # Get the color at the top-left corner
        bg_color = img.getpixel((0, 0))
        
        # Define a tolerance for matching the background color
        tolerance = 50
        
        # Flood fill the background from the corners with a unique color (transparent)
        # Note: (0, 0, 0, 0) is fully transparent black
        ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (img.width - 1, 0), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (0, img.height - 1), (0, 0, 0, 0), thresh=tolerance)
        ImageDraw.floodfill(img, (img.width - 1, img.height - 1), (0, 0, 0, 0), thresh=tolerance)
        
        img.save(output_path, "PNG")
        print(f"Successfully converted {input_path} to {output_path} with background removed.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    remove_bg()
