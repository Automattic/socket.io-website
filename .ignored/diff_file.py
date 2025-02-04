# docs/tutorial/01-introduction.md
# i18n/zh-CN/docusaurus-plugin-content-docs/current/tutorial/01-introduction.md
import glob
import hashlib
from os import chdir
from os.path import dirname

chdir(dirname(__file__) + "/..")

src_files = glob.glob('docs/tutorial/*.md')
dst_files = glob.glob('i18n/zh-CN/docusaurus-plugin-content-docs/current/tutorial/*.md')

for src_file in src_files:
    dst_file = 'i18n/zh-CN/docusaurus-plugin-content-docs/current/tutorial/' + src_file.split('/')[-1]
    src_md5 = hashlib.md5(open(src_file, 'rb').read()).hexdigest()
    dst_md5 = hashlib.md5(open(dst_file, 'rb').read()).hexdigest()
    if src_md5 != dst_md5:
        print(src_file, dst_file)
