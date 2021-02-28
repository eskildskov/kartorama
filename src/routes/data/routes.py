import csv
import json
import re
f = open('ex.csv', 'r')

with f:

  reader = csv.DictReader(f)

  routes = []
  for row in reader:
      
      if row['Himmelretning (topp til bunn)']:
        row['aspect'] = row['Himmelretning (topp til bunn)']

      if row['geojson']:
        row['geojson'] = json.loads(row['geojson'])

      if row['Løsneområder']:
        elevation_spans = row['Løsneområder'].replace(',', '.').split('.')
        row['Løsneområder'] = elevation_spans
          
      routes.append(row)

with open('ex.json', 'w') as file:
    file.write(json.dumps(routes))
