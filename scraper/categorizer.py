import re

# Same mapping logic used in JS frontend, now available for the Python backend scraper
KEYWORD_MAP = {
    'ai': 'AI / ML', 'ml': 'AI / ML', 'machine learning': 'AI / ML', 'llm': 'AI / ML',
    'data science': 'Data Science', 'data scientist': 'Data Science', 'decision science': 'Data Science',
    'data eng': 'Data Engineering', 'pipeline': 'Data Engineering',
    'data analyst': 'Data Analytics', 'analytics': 'Data Analytics',
    'frontend': 'Frontend / Design', 'ui/ux': 'Frontend / Design', 'react': 'Frontend / Design',
    'mobile': 'Mobile Dev', 'android': 'Mobile Dev', 'ios': 'Mobile Dev',
    'backend': 'Backend Dev', 'api': 'Backend Dev',
    'fullstack': 'Fullstack Dev', 'full stack': 'Fullstack Dev',
    'sde': 'SDE', 'software dev': 'SDE', 'software engineer': 'SDE',
    'quant': 'Quant / Algo Trading', 'algo': 'Quant / Algo Trading', 'trader': 'Quant / Algo Trading',
    'consulting': 'Consulting', 'consultant': 'Consulting',
    'product manager': 'Product Management', 'apm': 'Product Management',
    'hardware': 'Electronics / VLSI', 'vlsi': 'Electronics / VLSI', 'chip': 'Electronics / VLSI',
    # ... add more mappings to reach 39 categories ...
}

def categorize_role(role_title: str) -> tuple[str, str]:
    """
    Returns (category_group, category_name) based on substring matching.
    """
    title_lower = role_title.lower()
    
    # 1. Exact or partial keyword match
    for keyword, cat_name in KEYWORD_MAP.items():
        if re.search(r'\b' + re.escape(keyword) + r'\b', title_lower):
            return get_group(cat_name), cat_name
            
    # Fallback
    return 'other', 'Other'

def get_group(cat_name: str) -> str:
    # Simplified group matcher
    if cat_name in ['AI / ML', 'Data Science', 'Data Engineering', 'Data Analytics', 'SDE', 'Backend Dev', 'Fullstack Dev', 'Frontend / Design', 'Mobile Dev']:
        return 'tech'
    if cat_name in ['Quant / Algo Trading', 'Consulting', 'Product Management', 'Business Analysis']:
        return 'biz'
    if cat_name in ['Electronics / VLSI', 'Mechanical Engg', 'Civil / Structural']:
        return 'core'
    return 'other'
