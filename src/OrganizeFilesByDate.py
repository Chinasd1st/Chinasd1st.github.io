import os
import shutil
import re
from pathlib import Path

def extract_date_from_yaml(file_path):
    """
    从Markdown文件的YAML front matter中提取日期信息
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # 改进的正则表达式，更灵活地匹配YAML front matter
        yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*(?:\n|$)', content, re.DOTALL | re.MULTILINE)
        
        if not yaml_match:
            print(f"文件 {file_path.name} 中没有找到YAML front matter")
            return None, None
        
        yaml_content = yaml_match.group(1)
        
        # 直接在YAML内容中查找date字段
        date_match = re.search(r'^date:\s*(.+)$', yaml_content, re.MULTILINE | re.IGNORECASE)
        
        if not date_match:
            print(f"文件 {file_path.name} 的YAML front matter中没有找到date字段")
            return None, None
        
        date_str = date_match.group(1).strip()
        
        # 处理不同的日期格式
        date_patterns = [
            r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
            r'(\d{4})/(\d{1,2})/(\d{1,2})',  # YYYY/MM/DD
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})',  # YYYY.MM.DD
            r'(\d{4})-(\d{1,2})-(\d{1,2})\s+\d{1,2}:\d{1,2}:\d{1,2}',  # 带时间的日期
            r'(\d{4})-(\d{1,2})-(\d{1,2})T\d{1,2}:\d{1,2}:\d{1,2}(?:Z|[+-]\d{2}:\d{2})?',  # ISO 8601日期
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_str)
            if match:
                year = match.group(1)
                month = match.group(2).zfill(2)  # 确保月份是两位数
                return year, month
        
        print(f"文件 {file_path.name} 的date字段格式无法识别: {date_str}")
        return None, None
        
    except Exception as e:
        print(f"解析文件 {file_path.name} 的YAML front matter时出错: {str(e)}")
        return None, None

def organize_files_by_yaml_date():
    """
    根据Markdown文件YAML front matter中的日期信息组织文件
    """
    # 获取当前工作目录
    current_directory = Path.cwd()
    
    print(f"开始处理目录: {current_directory}")
    
    # 获取当前目录下的.md文件（排除README.md等特殊文件）
    md_files = list(current_directory.glob("*.md"))
    md_files = [f for f in md_files if not f.name.startswith("README")]
    
    if not md_files:
        print("未找到任何.md文件")
        return
    
    print(f"找到 {len(md_files)} 个.md文件")
    
    # 计数器
    processed_count = 0
    error_count = 0
    no_date_count = 0
    
    for file_path in md_files:
        try:
            # 从YAML front matter中提取日期
            year, month = extract_date_from_yaml(file_path)
            
            if not year or not month:
                print(f"文件 {file_path.name} 中没有找到有效的日期信息，跳过处理")
                no_date_count += 1
                continue
            
            # 构建目标路径
            year_folder = current_directory / year
            month_folder = year_folder / month
            destination_path = month_folder / file_path.name
            
            print(f"处理文件: {file_path.name}")
            print(f"YAML日期: {year}-{month}")
            print(f"目标路径: {destination_path}")
            
            # 创建目录（如果不存在）
            month_folder.mkdir(parents=True, exist_ok=True)
            print(f"创建目录: {month_folder}")
            
            # 移动文件
            shutil.move(str(file_path), str(destination_path))
            print(f"✓ 文件已移动到: {month_folder}")
            
            processed_count += 1
            
        except Exception as e:
            print(f"✗ 处理文件 {file_path.name} 时出错: {str(e)}")
            error_count += 1
        
        print("---")
    
    # 显示统计信息
    print(f"\n处理完成！")
    print(f"成功处理: {processed_count} 个文件")
    print(f"处理失败: {error_count} 个文件")
    print(f"无日期信息: {no_date_count} 个文件")
    
    # 显示最终的目录结构
    print(f"\n最终的目录结构:")
    for year_dir in sorted(current_directory.glob("*/")):
        if year_dir.is_dir() and year_dir.name.isdigit():
            print(f"📁 {year_dir.name}")
            for month_dir in sorted(year_dir.glob("*/")):
                if month_dir.is_dir():
                    print(f"  └── 📁 {month_dir.name}")
    
    print(f"\n提示: 所有文件已按YAML front matter中的日期信息整理到对应的年份/月份文件夹中")

def preview_files():
    """
    预览所有文件的YAML日期信息，不执行移动操作
    """
    current_dir = Path.cwd()
    md_files = list(current_dir.glob("*.md"))
    md_files = [f for f in md_files if not f.name.startswith("README")]
    
    if not md_files:
        print("未找到任何.md文件")
        return
    
    print("文件预览 (不执行移动操作):")
    print("=" * 50)
    
    for file in md_files:
        year, month = extract_date_from_yaml(file)
        if year and month:
            print(f"✓ {file.name} -> {year}/{month}/")
        else:
            print(f"✗ {file.name} -> 无有效日期信息")

def main():
    """
    主函数 - 提供用户确认提示
    """
    print("=" * 50)
    print("文件按YAML日期归档工具")
    print("=" * 50)
    print("此脚本将:")
    print("1. 扫描当前目录下的所有.md文件")
    print("2. 解析每个文件的YAML front matter中的date字段")
    print("3. 根据日期创建年份/月份文件夹")
    print("4. 将文件移动到对应的文件夹中")
    print("=" * 50)
    
    # 先预览所有文件
    preview_files()
    
    print("=" * 50)
    action = input("请选择操作: (1)执行移动 (2)仅预览 (3)取消: ").strip()
    
    if action == "1":
        organize_files_by_yaml_date()
    elif action == "2":
        print("仅预览模式完成")
    else:
        print("操作已取消")

if __name__ == "__main__":
    main()
