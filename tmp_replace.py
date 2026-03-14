import re

def replace_colors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements for MyShowsPage & HomePage
    # Replace teal with red
    content = re.sub(r'teal-([0-9]+)', r'red-\1', content)
    # Replace emerald with red
    content = re.sub(r'emerald-([0-9]+)', r'red-\1', content)
    
    # Specific hex replacements for gradients
    content = content.replace('#14b8a6', '#b91c1c')
    content = content.replace('#0d9488', '#991b1b')
    content = content.replace('#0f766e', '#7f1d1d')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_colors(r"c:\Users\eMu\emuList-M-S-G\src\frontend\pages\MyShowsPage.tsx")
replace_colors(r"c:\Users\eMu\emuList-M-S-G\src\frontend\pages\HomePage.tsx")

print("Color replacement complete.")
