---
url: /post/2026/04/AstroMigration.md
---
# 从 VuePress Theme Hope 迁移到 Astro Firefly

## Intro

众所周知，VuePress 1 现在已经进入 maintenance-only 状态，VuePress 2 也是半死不活，rc 版本的开发维护工作已经移交给社区。Vue 官方在 Vitepress 的文档中说道：\*并行维护两个 SSG 是难以持续的，因此 Vue 团队决定将 VitePress 作为长期维护并推荐的 SSG。现在 VuePress 1 已被弃用，VuePress 2 已移交给 VuePress 社区团队进行进一步开发和维护。\*因此在2026年这个时点进行迁移是十分有必要的。

\~~虽然本站基本上不会迁移到 Astro（因为重新配置 SEO 和各种 Dependencies 非常搞）~~

本站是一个博客站点，因此我选择了相较于 Vitepress 对博客构建更为友好的 Astro 作为迁移目标。Astro 的性能因为原生零客户端JS，相较于 VuePress 和 Vitepress 都更为出色，Lighthouse 的性能评分一般都能大于90分，相比之下本站五十几分的性能分数就显得捉襟见肘（其实是因为本人加了太多图片，，）。

主题方面，我则选择了 Firefly 这一基于 Material Design 的博客主题。这一主题性能优秀、功能繁多，并且高度可定制，同时主题本身还提供了自动压缩图片等异常实用的功能（终于不用每次都用 squoosh 转成 Webp 了哈哈）。虽然它不像 Theme Hope 那样开箱即用，但是对于普通 Blogger 来说也是绰绰有余。

Astro 并不完全兼容 VuePress 2（Theme Hope）的语法，有很多地方需要进行改动。具体差异参见<https://docs.astro.build/zh-cn/guides/migrate-to-astro/from-vuepress/>。然而手动修改这么多篇文章的配置显得不太现实，因此作者让 Grok 和 Gemini 生成了一些批量修改代码。

以下语法均以 Firefly 主题为例。

## 迁移

### 脚本运行相关

运行环境：Python 3.13.11 (venv)（3.8+ 都可以）

使用时建议在项目根目录中找到 `scripts` 文件夹并将脚本放在这个目录中运行，否则执行 `pnpm build` 时有可能导致错误运行脚本文件导致构建失败。

可能用到的依赖安装命令：

```bash
pip install -r requirements.txt
```

### 脚注格式

VuePress Theme Hope提供了两种脚注格式：

* 行内脚注：

  ```md
  行内的脚注^[行内脚注文本] 定义。
  ```

* 普通脚注：

  ```md
  脚注 1 链接[^first]。

  脚注 2 链接[^second]。

  重复的页脚定义[^second]。

  [^first]: 脚注 **可以包含特殊标记**

      也可以由多个段落组成

  [^second]: 脚注文字。
  ```

然而，Firefly 主题 ==原生== 不支持行内脚注。以下是由Gemini 3.1 Pro生成的批量迁移代码：

::: code-tabs

@tab footnote\_fixer.py

```py title="scripts/footnote_fixer.py" :collapsed-lines
import os
import re
import shutil
import difflib
import argparse
import pydoc
from pathlib import Path

def find_custom_footnotes(text):
    """
    Find all footnotes in the format ^[{content}].
    Uses a cursor-based approach to support nested brackets (e.g., Markdown links).
    """
    results = []
    i = 0
    while i < len(text):
        idx = text.find('^[', i)
        if idx == -1:
            break
        
        depth = 0
        start = idx + 2
        end = -1
        
        for j in range(start, len(text)):
            if text[j] == '[':
                depth += 1
            elif text[j] == ']':
                if depth == 0:
                    end = j
                    break
                else:
                    depth -= 1
                    
        if end != -1:
            content = text[start:end]
            if not content.isdigit():
                results.append((idx, end + 1, content))
            i = end + 1
        else:
            i = start
    return results

def process_markdown_file(file_path):
    """
    Process a single markdown file and return original and modified text.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        original_text = f.read()

    target_footnotes = find_custom_footnotes(original_text)
    if not target_footnotes:
        return None

    existing_indices = [int(m.group(1)) for m in re.finditer(r'\[\^(\d+)\]', original_text)]
    current_max = max(existing_indices) if existing_indices else 0

    replacements = []
    new_footnote_definitions = []

    for start, end, content in target_footnotes:
        current_max += 1
        replacements.append((start, end, current_max))
        new_footnote_definitions.append((current_max, content))

    modified_text = original_text
    # Replace from back to front to maintain index integrity
    for start, end, footnote_idx in reversed(replacements):
        prefix_space = " " if start > 0 and modified_text[start-1] == ']' else ""
        modified_text = modified_text[:start] + f"{prefix_space}[^{footnote_idx}]" + modified_text[end:]

    if new_footnote_definitions:
        modified_text = modified_text.rstrip() + '\n\n'
        for idx, content in new_footnote_definitions:
            modified_text += f'[^{idx}]: {content}\n'

    return original_text, modified_text

def main():
    parser = argparse.ArgumentParser(description="Markdown Footnote Formatter")
    parser.add_argument('--auto', action='store_true', help="Auto-confirm without prompt (useful for build pipelines)")
    args = parser.parse_args()

    directory = "."
    # Find all .md files recursively
    all_files = list(Path(directory).rglob("*.md"))
    
    # Filter out node_modules to avoid unnecessary scanning in Vite projects
    md_files = [f for f in all_files if "node_modules" not in str(f)]
    
    if not md_files:
        print("No .md files found.")
        return

    changes_dict = {}
    for md_file in md_files:
        try:
            result = process_markdown_file(md_file)
            if result:
                changes_dict[md_file] = result
        except Exception as e:
            print(f"Error processing {md_file}: {e}")

    if not changes_dict:
        print("🎉 Scan complete. No footnotes need to be replaced.")
        return

    print(f"Found {len(changes_dict)} file(s) with changes.")

    if args.auto:
        print("Detected --auto flag. Executing replacements directly...")
        confirm_status = True
    else:
        # Build a single string for all diffs to be displayed via pager
        full_diff_output = []
        full_diff_output.append("=== PREVIEW OF CHANGES (Press 'q' to exit pager) ===\n")
        
        for file_path, (orig_text, mod_text) in changes_dict.items():
            full_diff_output.append(f"\nFILE: {file_path}")
            full_diff_output.append("-" * len(str(file_path)))
            
            diff = difflib.unified_diff(
                orig_text.splitlines(keepends=True), 
                mod_text.splitlines(keepends=True),
                fromfile='Before', tofile='After', n=2
            )
            full_diff_output.extend(list(diff))
        
        # Use pydoc.pager to allow scrolling through long outputs
        pydoc.pager("".join(full_diff_output))
        
        # Prevent accidental cancellation due to rapid Enter key presses
        print("\n" + "="*50)
        print(">>> PREVIEW FINISHED.")
        print(f">>> {len(changes_dict)} file(s) pending modification.")
        print("="*50)
        
        while True:
            user_input = input("Confirm replacement and generate .bak files? (y/n): ").strip().lower()
            if user_input == 'y':
                confirm_status = True
                break
            elif user_input == 'n':
                confirm_status = False
                break
            else:
                # If the user just pressed Enter or typed something else, ask again
                print("Invalid input. Please enter 'y' to confirm or 'n' to cancel.")

    if confirm_status:
        for file_path, (orig_text, mod_text) in changes_dict.items():
            bak_file_path = str(file_path) + ".bak"
            shutil.copy2(file_path, bak_file_path)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(mod_text)
        print("✅ Replacement complete!")
    else:
        print("❌ Operation cancelled.")

if __name__ == "__main__":
    main()
```

@tab 提示词

```txt
编写一个python文件。要求：
1. 查找所有^[{脚注内容}]，{脚注内容}不是阿拉伯数字
2. 替换为[^{脚注编号}]的形式，同时要求查找文件内已有的类似格式的脚注，避免重复编号，同时注意^位置应在方括号内部，新生成的脚注内容放在文末
3. 替换前事先提供预览，同时生成bak备份文件
4. 仅替换md文件，同时替换目录下的所有md文件
实例：

而这还是小巫见大巫。譬如去年十二月的 **React2Shell** 致命漏洞（CVE-2025-55182）,CVSS评分直接来到一个满分10分，Cloudflare 在紧急部署防护规则时，间接导致了一次约半小时的局部停摆。[^1]^[[Cloudflare outage on December 5, 2025.](https://blog.cloudflare.com/5-december-2025-outage)]RSC的引入虽优化了前端网页的性能，但也在无形间产生了安全风险。一旦协议验证不足，后果就是服务器直接沦陷。前端开发越来越“全栈化”，我们享受便利的同时，也把后端风险带进了浏览器生态。

[^1]: [Critical Security Vulnerability in React Server Components – React.](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)

替换为：
而这还是小巫见大巫。譬如去年十二月的 **React2Shell** 致命漏洞（CVE-2025-55182）,CVSS评分直接来到一个满分10分，Cloudflare 在紧急部署防护规则时，间接导致了一次约半小时的局部停摆。[^1] [^2] RSC的引入虽优化了前端网页的性能，但也在无形间产生了安全风险。一旦协议验证不足，后果就是服务器直接沦陷。前端开发越来越“全栈化”，我们享受便利的同时，也把后端风险带进了浏览器生态。

[^1]: [Critical Security Vulnerability in React Server Components – React.](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
[^2]: [Cloudflare outage on December 5, 2025.](https://blog.cloudflare.com/5-december-2025-outage)
```

:::

### YAML Frontmatter 中更新时间迁移

相较于 Theme Hope，Firefly 主题中提供了 `updated` 这一属性用于展示更新日期。虽然这一属性是 optional 的，但是为了美观，我们也可以选择填写。

作者本人是直接将 VuePress 项目中的 md 文件复制到 Firefly 项目 content 目录的。由于迁移后一些属性、语法并不适用，因此可能对文章内容进行修改，这就会导致文章实质内容修改时间被污染。因此作者想到可以使用复制的源文件的修改时间作为 Updated 字段的填入内容，而非粘贴后文件的修改时间。

::: code-tabs

@tab sync\_mtime\_to\_yaml.py

```py title="scripts/sync_mtime_to_yaml.py" :collapsed-lines
import os
import re
import shutil
import datetime
from pathlib import Path

def get_file_mtime(file_path):
    """获取文件的最后修改时间，返回格式为 yyyy-mm-dd"""
    stat = os.stat(file_path)
    # 使用本地时间
    mtime = datetime.datetime.fromtimestamp(stat.st_mtime)
    return mtime.strftime('%Y-%m-%d')

def update_yaml_frontmatter(file_path, updated_date):
    """更新或创建 Markdown 文件的 YAML Frontmatter 中的 updated 字段"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 正则表达式匹配 YAML Frontmatter (--- ... ---)
    yaml_pattern = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)
    match = yaml_pattern.match(content)

    new_content = ""
    updated_field = f"updated: {updated_date}"

    if match:
        # 存在 Frontmatter
        frontmatter = match.group(1)
        body = content[match.end():]
        
        # 检查是否已有 updated 字段
        if re.search(r'^updated:', frontmatter, re.MULTILINE):
            # 替换旧的 updated 字段
            new_frontmatter = re.sub(r'^updated:.*$', updated_field, frontmatter, flags=re.MULTILINE)
        else:
            # 在 Frontmatter 末尾追加 updated 字段
            new_frontmatter = frontmatter.rstrip() + f"\n{updated_field}"
        
        new_content = f"---\n{new_frontmatter}\n---\n{body}"
    else:
        # 不存在 Frontmatter，在开头新建
        new_content = f"---\n{updated_field}\n---\n\n{content}"

    # 修改前备份
    shutil.copy2(file_path, str(file_path) + ".bak")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    print("=== Markdown 修改日期同步工具 ===")
    src_dir_input = input("请输入源文件目录 (获取修改时间): ").strip()
    dst_dir_input = input("请输入目标文件目录 (填写 YAML): ").strip()

    src_root = Path(src_dir_input)
    dst_root = Path(dst_dir_input)

    if not src_root.exists() or not dst_root.exists():
        print("错误：源目录或目标目录不存在，请检查路径。")
        return

    # 递归查找源目录下的所有 .md 文件
    src_files = list(src_root.rglob("*.md"))
    
    if not src_files:
        print("源目录下未找到 .md 文件。")
        return

    print(f"开始处理，共发现 {len(src_files)} 个源文件...")
    success_count = 0
    skip_count = 0

    for src_file in src_files:
        # 获取相对路径，以便在目标目录中寻找对应文件
        rel_path = src_file.relative_to(src_root)
        dst_file = dst_root / rel_path

        if dst_file.exists():
            try:
                mdate = get_file_mtime(src_file)
                update_yaml_frontmatter(dst_file, mdate)
                print(f" [OK] 已同步: {rel_path} -> {mdate}")
                success_count += 1
            except Exception as e:
                print(f" [ERR] 处理 {rel_path} 时出错: {e}")
        else:
            # print(f" [SKIP] 目标目录不存在对应文件: {rel_path}")
            skip_count += 1

    print("-" * 30)
    print(f"同步完成！")
    print(f"成功更新: {success_count}")
    print(f"未找到对应目标文件: {skip_count}")
    print(f"备份文件已生成 (.bak)")

if __name__ == "__main__":
    main()
```

@tab 提示词

```txt
请你帮我编写一个程序：复制某一directory中文件的的修改日期，并将其编写到另一directory中对应同名文件的Frontmatter中。

1. 用户输入：
    1. 源文件（需要获取修改时间的文件）目录
    2. 目标文件（需要在yaml Frontmatter中填写updated: 字段的目标文件）目录

2. 事例：输入src1 ，src1中有一文件名为1. md，他的修改时间（windows）为2025.4.4；输入src2，src2中有一同名文件1.md, 在md的yaml Frontmatter中填写`updated: 2025-04-04`（为yyyy-mm-dd）
请你输出，要求递归查找所有子目录中文件，并进行替换
```

:::

### Categories 和 Tags 的迁移

Theme Hope 中，分类和标签均接受 String 类型或列表类型的输入。

```yaml
tag:
  - HTML
  - Web
category:
  - HTML
# 或： 
# category: HTML
```

然而 Firefly 中，分类仅接受 String，标签仅接受 String\[]。如：

```yaml
category: 计算机技术
tags: ["计算机", "漏洞"]
```

::: code-tabs

@tab convert\_frontmatter.py

```py title="scripts/convert_frontmatter.py" :collapsed-lines
import sys
from pathlib import Path
import re
from ruamel.yaml import YAML
from ruamel.yaml.scalarstring import DoubleQuotedScalarString
from io import StringIO

def process_frontmatter(content: str) -> tuple[bool, str, str]:
    """同时处理 category 和 tags/tag"""
    
    fm_match = re.search(r'^(---\s*[\r\n]+)(.*?)([\r\n]+---\s*[\r\n]?)', content, re.DOTALL)
    if not fm_match:
        return False, content, "未检测到 Frontmatter"

    front_start, fm_body, front_end = fm_match.groups()
    remaining = content[fm_match.end():]

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.allow_unicode = True
    yaml.width = 2000
    yaml.default_flow_style = True

    try:
        metadata = yaml.load(fm_body)
    except Exception as e:
        return False, content, f"YAML 解析失败: {e}"

    changed = False
    preview_lines = []

    # ==================== 处理 category / categories ====================
    cat_key = None
    if 'category' in metadata:
        cat_key = 'category'
    elif 'categories' in metadata:
        cat_key = 'categories'

    if cat_key:
        cat = metadata.get(cat_key)
        if isinstance(cat, list) and len(cat) > 0:
            first_item = str(cat[0]).strip()
            metadata[cat_key] = first_item
            changed = True
            preview_lines.append(f"原 {cat_key}: {cat}\n→ 新 {cat_key}: {first_item}")
        elif isinstance(cat, (str, int, float)):
            preview_lines.append(f"{cat_key} 已经是字符串，跳过")
        else:
            preview_lines.append(f"{cat_key} 类型不支持，跳过")

    # ==================== 处理 tags / tag ====================
    tag_key = None
    if 'tags' in metadata:
        tag_key = 'tags'
    elif 'tag' in metadata:
        tag_key = 'tag'

    if tag_key:
        tags = metadata.get(tag_key)
        if isinstance(tags, (str, int, float)):
            tags = [str(tags)]
        elif not isinstance(tags, list):
            preview_lines.append(f"{tag_key} 不是列表，跳过")
            tags = None

        if tags and len(tags) > 0:
            metadata[tag_key] = [DoubleQuotedScalarString(str(t).strip()) for t in tags]
            changed = True
            preview_lines.append(f"原 {tag_key}: {tags}\n→ 新 {tag_key}: {metadata[tag_key]}")

    if not changed:
        return False, content, "没有需要修改的字段"

    # 生成新的 frontmatter
    stream = StringIO()
    yaml.dump(metadata, stream)
    new_fm_body = stream.getvalue().strip()

    new_content = front_start + new_fm_body + "\n" + front_end.strip() + "\n" + remaining

    preview = "\n".join(preview_lines)
    return True, new_content, preview


def main(directory="."):
    md_files = list(Path(directory).rglob("*.md"))
    print(f"共扫描到 {len(md_files)} 个 .md 文件\n")

    to_modify = []

    for file_path in sorted(md_files):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            changed, new_content, preview = process_frontmatter(content)

            if changed:
                rel_path = file_path.relative_to(Path(directory))
                print(f"【将转换】 {rel_path}")
                print(f"{preview}\n")
                to_modify.append((file_path, new_content))

        except Exception as e:
            print(f"处理失败 {file_path.name}: {e}")

    if not to_modify:
        print("没有找到需要转换的文件。")
        return

    print(f"\n总计发现 {len(to_modify)} 个文件需要转换。")
    confirm = input("\n是否执行替换？(输入 y 或 yes 确认，其他取消): ").strip().lower()

    if confirm not in ('y', 'yes'):
        print("操作已取消。")
        return

    success = 0
    for file_path, new_content in to_modify:
        try:
            backup = file_path.with_suffix('.md.bak')
            with open(backup, 'w', encoding='utf-8') as f:
                f.write(open(file_path, 'r', encoding='utf-8').read())

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ 替换成功: {file_path.name}")
            success += 1
        except Exception as e:
            print(f"✗ 写入失败 {file_path.name}: {e}")

    print(f"\n完成！成功处理 {success}/{len(to_modify)} 个文件（已自动生成 .bak 备份）")


if __name__ == "__main__":
    print("=== Markdown Frontmatter 清理工具 ===\n")
    print("功能：")
    print("  - category/categories → 只保留第一项并转为字符串")
    print("  - tags/tag → 转为紧凑行内数组 [\"标签1\", \"标签2\"]\n")

    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    main(target_dir)

```

@tab 依赖

```txt title="requirements.txt"
python-frontmatter>=1.0.0
ruamel.yaml>=0.18.0
ruamel.yaml.clib>=0.2.0; platform_python_implementation != "PyPy"
```

:::

### Cover Yaml 的迁移

Theme Hope 中，文章封面路径使用 cover 属性来决定。Firefly 中，则使用 image 属性选择 Src。

```py title="scripts/convert_cover_to_image.py" :collapsed-lines
import sys
from pathlib import Path
import re
from ruamel.yaml import YAML
from io import StringIO

def convert_cover_to_image(content: str) -> tuple[bool, str, str]:
    """将 Frontmatter 中的 cover: 替换为 image:"""
    
    # 匹配 frontmatter
    fm_match = re.search(r'^(---\s*[\r\n]+)(.*?)([\r\n]+---\s*[\r\n]?)', content, re.DOTALL)
    if not fm_match:
        return False, content, "未检测到 Frontmatter"

    front_start, fm_body, front_end = fm_match.groups()
    remaining = content[fm_match.end():]

    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.allow_unicode = True
    yaml.width = 2000
    yaml.default_flow_style = True

    try:
        metadata = yaml.load(fm_body)
    except Exception as e:
        return False, content, f"YAML 解析失败: {e}"

    if 'cover' not in metadata:
        return False, content, "没有 cover 字段，跳过"

    # 执行替换：cover → image
    cover_value = metadata.pop('cover')
    metadata['image'] = cover_value

    # 生成新的 frontmatter
    stream = StringIO()
    yaml.dump(metadata, stream)
    new_fm_body = stream.getvalue().strip()

    new_content = front_start + new_fm_body + "\n" + front_end.strip() + "\n" + remaining

    preview = f"原 cover: {cover_value}\n→ 新 image: {cover_value}"

    return True, new_content, preview


def main(directory="."):
    md_files = list(Path(directory).rglob("*.md"))
    print(f"共扫描到 {len(md_files)} 个 .md 文件\n")

    to_modify = []

    for file_path in sorted(md_files):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            changed, new_content, preview = convert_cover_to_image(content)

            if changed:
                rel_path = file_path.relative_to(Path(directory))
                print(f"【将转换】 {rel_path}")
                print(f"   {preview}\n")
                to_modify.append((file_path, new_content))

        except Exception as e:
            print(f"处理失败 {file_path.name}: {e}")

    if not to_modify:
        print("没有找到包含 cover 字段的文件。")
        return

    print(f"\n总计发现 {len(to_modify)} 个文件需要转换。")
    confirm = input("\n是否执行替换？(输入 y 或 yes 确认，其他取消): ").strip().lower()

    if confirm not in ('y', 'yes'):
        print("操作已取消。")
        return

    success = 0
    for file_path, new_content in to_modify:
        try:
            # 自动备份
            backup = file_path.with_suffix('.md.bak')
            with open(backup, 'w', encoding='utf-8') as f:
                f.write(open(file_path, 'r', encoding='utf-8').read())

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✓ 替换成功: {file_path.name}")
            success += 1
        except Exception as e:
            print(f"✗ 写入失败 {file_path.name}: {e}")

    print(f"\n完成！成功处理 {success}/{len(to_modify)} 个文件（已生成 .bak 备份）")


if __name__ == "__main__":
    print("=== Frontmatter cover: → image: 转换工具 ===\n")
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    main(target_dir)
```

### Admonitions 的迁移

VuePress 中的 Admonitions 提醒框语法类似于 Docusaurus 风格。

在 `siteConfig.ts` 的 `rehypeCallouts.theme` 中改为 Obsidian 来启用 `:::` 包裹的 Admonitions。需要注意的是，VuePress中自定义 Admonitions title 直接在 `warning`、`info` 这些类型后跟上标题即可，而 Firefly 中需要在类型后紧跟 `[title]` 才能正确渲染。更改提醒框主题后需要重启开发服务器才能生效。

## Firefly 主题配置

### Expressive Code

Firefly 使用基于 Shiki 的 Expressive Code 渲染器，整体显得更为现代化，主题也更为多样。

用户可直接在 `expressiveCodeConfig.ts` 中进行相关配置。

## 其他

此外就是 Firefly 特有的一些 Config 修改了，这些内容无关痛痒（？），本文不再赘述，具体可参考 Firefly 官方文档。

tbc...（懒得写）
