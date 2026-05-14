"""
Deep check: verify all routes load without JS errors.
Server is already running at http://localhost:3000
"""
from playwright.sync_api import sync_playwright

ROUTES = [
    ('/', 'Landing page'),
    ('/login', 'Login page'),
    ('/signup', 'Signup page'),
    ('/browse', 'Browse page'),
    ('/u/nonexistent', 'Public profile 404'),
    ('/404', '404 page'),
]

errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    console_errors = []
    page.on('console', lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == 'error' else None)
    
    for route, label in ROUTES:
        url = f'http://localhost:3000{route}'
        console_errors.clear()
        try:
            response = page.goto(url, wait_until='networkidle', timeout=15000)
            status = response.status if response else 'no response'
            
            # Check for crash indicators
            body_text = page.inner_text('body')
            has_content = len(body_text.strip()) > 10
            
            if status != 200:
                errors.append(f"  WARN {label} ({route}): HTTP {status}")
            elif not has_content:
                errors.append(f"  FAIL {label} ({route}): Empty page body")
            else:
                print(f"  OK   {label} ({route}): HTTP {status}, content rendered")
            
            # Report JS errors (filter out known noise)
            for err in console_errors:
                if 'i18next' not in err and 'favicon' not in err:
                    errors.append(f"  JS   {label} ({route}): {err[:120]}")
        except Exception as e:
            errors.append(f"  FAIL {label} ({route}): {str(e)[:100]}")
    
    # Take a screenshot of the landing page
    page.goto('http://localhost:3000/', wait_until='networkidle', timeout=15000)
    page.screenshot(path='d:/Project 3 Selise Block/universal-profile-engine/landing-screenshot.png', full_page=True)
    print("\n  Screenshot saved: landing-screenshot.png")
    
    browser.close()

print("\n--- Summary ---")
if errors:
    print(f"Issues found ({len(errors)}):")
    for e in errors:
        print(e)
else:
    print("All routes load cleanly. No JS errors. App is working.")
