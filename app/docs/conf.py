# Configuration file for the Sphinx documentation builder [[3]][[4]]
import os
import sys

# -- Path setup --------------------------------------------------------------
# Add your project's source directory to Python path [[10]]
sys.path.insert(0, os.path.abspath('../'))  # Adjust path to your code

# -- Project information -----------------------------------------------------
project = 'ComplianceAI Agent'  # Name of your project [[7]]
author = 'Losers!'
version = '1.0'  # Version number
release = '1.0.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'sphinx.ext.autodoc',      # Auto-generate docs from docstrings [[2]]
    'sphinx.ext.viewcode',     # Link to source code in HTML [[4]]
    'sphinx_rtd_theme',        # Read the Docs theme [[8]]
]

templates_path = ['_templates']  # Template files location
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# -- HTML output -------------------------------------------------------------
html_theme = 'sphinx_rtd_theme'  # Theme for HTML output [[8]]
html_static_path = ['_static']    # Static files (CSS, images)

# -- Autodoc settings --------------------------------------------------------
autodoc_default_options = {
    'members': True,
    'undoc-members': True,
    'private-members': False,
}