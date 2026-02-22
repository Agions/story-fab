#!/usr/bin/env python3
import os
import re

# We will recursively update models in src/
replacements = {
    # Text names
    "GPT-4o": "GPT-5.2",
    "GPT-4o (通用)": "GPT-5.2 (旗舰通用)",
    "Claude 3 Opus": "Claude 4.6 Opus",
    "Claude 3 Opus (高精度)": "Claude 4.6 Opus (超长推理)",
    "Claude 3 Sonnet": "Claude 4.6 Sonnet",
    "Gemini 1.5 Pro": "Gemini 3.1 Pro",
    "Gemini 1.5 Pro (多模态)": "Gemini 3.1 Pro (深度逻辑)",
    "Qwen 3.5": "Qwen 3.5 (原生多模态版)",
    "GPT-5.2": "GPT-5.2", # To avoid double replace if already doing some
    
    # Model IDs
    "'gpt-4o'": "'gpt-5.2'",
    '"gpt-4o"': '"gpt-5.2"',
    "'claude-3-opus'": "'claude-4.6-opus'",
    '"claude-3-opus"': '"claude-4.6-opus"',
    "'claude-3-sonnet'": "'claude-4.6-sonnet'",
    '"claude-3-sonnet"': '"claude-4.6-sonnet"',
    "'gemini-1.5-pro'": "'gemini-3.1-pro'",
    '"gemini-1.5-pro"': '"gemini-3.1-pro"',
    "'gemini-1.5-flash'": "'gemini-3.1-flash'",
    '"gemini-1.5-flash"': '"gemini-3.1-flash"',
    "'qwen-turbo'": "'qwen3.5-turbo'",
    '"qwen-turbo"': '"qwen3.5-turbo"',
    "'qwen-plus'": "'qwen3.5-plus'",
    '"qwen-plus"': '"qwen3.5-plus"',
    "'qwen-max'": "'qwen3.5-max'",
    '"qwen-max"': '"qwen3.5-max"'
}

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for old_val, new_val in replacements.items():
        if old_val in new_content:
            new_content = new_content.replace(old_val, new_val)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.less', '.css', '.json', '.html')):
                filepath = os.path.join(root, file)
                update_file(filepath)

if __name__ == '__main__':
    src_dir = '/Users/zfkc/Desktop/04-AI工具/clip-flow/src'
    process_dir(src_dir)
    print("Done updating models.")
