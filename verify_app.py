import os
import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    # 1. Go to the app
    try:
        # Give some time for the server to start
        time.sleep(5)
        page.goto("http://localhost:3000")
        print("Navigated to http://localhost:3000")
    except Exception as e:
        print(f"Failed to navigate: {e}")
        browser.close()
        return

    # 2. Upload file
    # We need to find the file input. It is hidden but has id="file-upload"
    # Playwright's set_input_files works on the input element.

    # Check if we are on the upload page
    try:
        expect(page.get_by_text("Terraform Visualizer")).to_be_visible(timeout=5000)
    except:
        print("Could not find title 'Terraform Visualizer'. Saving screenshot.")
        page.screenshot(path="verification_failed_home.png")
        browser.close()
        return

    file_path = os.path.abspath("terraform-gui/sample-plan.json")
    if not os.path.exists(file_path):
        print(f"Sample plan not found at {file_path}")
        browser.close()
        return

    print(f"Uploading {file_path}")
    page.set_input_files('input[type="file"]', file_path)

    # 3. Wait for diagram
    # We expect nodes to appear. Our nodes have text like "aws_vpc.main"
    print("Waiting for diagram...")
    try:
        # Wait for the node "aws_vpc.main" to be visible
        # React Flow nodes usually have text content
        # Note: The text might be split or nested.
        # Our CustomNode renders "aws_vpc.main" as label.
        expect(page.get_by_text("main", exact=False).first).to_be_visible(timeout=10000)
    except Exception as e:
        print(f"Diagram did not load: {e}")
        page.screenshot(path="verification_failed_diagram.png")
        browser.close()
        return

    # 4. Click on a node to show details
    print("Clicking node...")
    # Using a locator that finds the node. "main" is the name of the VPC resource.
    # We can try to find by text "main" inside the React Flow pane.
    page.get_by_text("main", exact=False).first.click()

    # 5. Check if details pane appeared
    try:
        expect(page.get_by_text("Copy Apply Command")).to_be_visible()
    except:
         print("Details pane did not appear.")

    # 6. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification_success.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
