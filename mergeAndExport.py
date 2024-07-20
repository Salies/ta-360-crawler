import json
import pandas as pd

sale_full_json = json.loads(open('data/sale.json', encoding='utf-8').read())
sale_checked = json.loads(open('data/saleChecked.json', encoding='utf-8').read())

df_full = pd.DataFrame(sale_full_json)
df_checked = pd.DataFrame(sale_checked)

# for every gameName in df_full, if its in df_checked, replace df_full['gameUrl'] with df_checked['gameUrl']
df_full['gameUrl'] = df_full['gameName'].apply(lambda x: df_checked[df_checked['gameName'] == x]['gameUrl'].values[0] if x in df_checked['gameName'].values else df_full[df_full['gameName'] == x]['gameUrl'].values[0])

df_full.to_csv('data/saleFull.csv', index=False)