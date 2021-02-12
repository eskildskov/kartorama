import csv
import json
import re
f = open('ex.csv', 'r')
with f:

  reader = csv.DictReader(f)

  routes = []
  for row in reader:
      if row['geojson']:
        row['geojson'] = json.loads(row['geojson'])

      if row['Løsneområder']:
        elevation_spans = []
        losne = row['Løsneområder'].split('.')
        
        for elevation_span in losne:
          elevation_span = elevation_span.replace(':', '-')
          splitted = elevation_span.split('-')
          elevation_spans.append({
            'lower_elevation':splitted[0],
            'upper_elevation':splitted[1], 
            'min_gradient': splitted[2],
            'max_gradient': splitted[3]
          })

        row['Løsneområder'] = elevation_spans
          
      routes.append(row)

with open('ex.json', 'w') as file:
    file.write(json.dumps(routes))
