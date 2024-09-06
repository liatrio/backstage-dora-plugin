#!/bin/bash

# Define the file paths
APP_FILE="./packages/app/src/App.tsx"
SIDEBAR_FILE="./packages/app/src/components/Root/Root.tsx"
ENTITY_PAGE_FILE="./packages/app/src/components/catalog/EntityPage.tsx"
CONFIG_FILE="./app-config.yaml"

# Add FlatRoute

echo "Adding FlatRoute for DORA Team View"

lineToInsert='import { EntityDORACharts } from '\''backstage-dora-plugin'\'';'

if ! grep -qF "$lineToInsert" "$APP_FILE"; then
  sed -i "/import React.*/a\\$lineToInsert" "$APP_FILE"
fi

lineToInsert='    <Route path="/dora" element={<EntityDORACharts showTeamSelection />} />'

if ! grep -qF "$lineToInsert" "$APP_FILE"; then
  sed -i '/<FlatRoutes>/a\\'"$lineToInsert" "$APP_FILE"
fi

# Add Sidebar Nav

echo "Adding Sidebar Navigation"

lineToInsert='      <SidebarItem icon={DoraLogo} to="dora" text="Dora Metrics" />'

if ! grep -qF "$lineToInsert" "$SIDEBAR_FILE"; then
  sed -i '/<SidebarSpace \/>/i \ \ \ \ \ \ <SidebarItem icon={DoraLogo} to="dora" text="Dora Metrics" />' "$SIDEBAR_FILE"
fi

# Add to Components

echo "Adding Component Integration"

lineToInsert='import { EntityDORACharts, EntityDORAAtAGlance } from 'backstage-dora-plugin';'

if ! grep -qF "$lineToInsert" "$ENTITY_PAGE_FILE"; then
  sed -i "/import React.*/a\\$lineToInsert" "$ENTITY_PAGE_FILE"
fi

lineToInsert='const doraContent = (\n  <Grid container spacing=\{3\} alignItems="stretch">\n    \{entityWarningContent\}\n    <EntityDORACharts showTeamSelection=\{false\} />\n  </Grid>\n);'

if ! grep -qF "const doraContent = (" "$ENTITY_PAGE_FILE"; then
  sed -i '/const entityWarningContent = (/,/^);$/{
    /^);$/a\\'\n"$lineToInsert"'
  }' "$ENTITY_PAGE_FILE"
fi

lineToInsert='    <Grid item md={6}>\n      <EntityDORAAtAGlance />\n    </Grid>'

if ! grep -qF "<EntityDORAAtAGlance />" "$ENTITY_PAGE_FILE"; then
  sed -i '/const overviewContent = (/,/{entityWarningContent}/{/{entityWarningContent}/a\'"$lineToInsert"'
}' "$ENTITY_PAGE_FILE"
fi

lineToInsert='    <EntityLayout.Route path="/dora" title="DORA">\n      {doraContent}\n    </EntityLayout.Route>'
pages=('serviceEntityPage' 'defaultEntityPage' 'websiteEntityPage')

for page in "${pages[@]}"; do
  output=$(sed -n '/const '"$page"' = (/{
    n; /<EntityLayoutWrapper>/{
      :a; n;
      /<EntityLayout\.Route path="\/dora" title="DORA">/p;
      /<\/EntityLayoutWrapper>/!{h;ba}; x; q
    }
  }' "$ENTITY_PAGE_FILE")

  if [[ -z "$output" ]]; then
    sed -i '/const '"$page"' = (/{
      n; /<EntityLayoutWrapper>/{
        :a; n;
        /<\/EntityLayoutWrapper>/{i\
  \n'"$lineToInsert"'
        }; /<\/EntityLayoutWrapper>/!ba
      }
    }' "$ENTITY_PAGE_FILE"
  fi
done

echo "Adding Configuration"

read -p "Please enter the URL for the DORA API: " DORA_API_URL

# Add DORA API proxy endpoint
if ! grep -q "/dora/api:" "$CONFIG_FILE"; then
  echo "Adding proxy endpoint for DORA API in $CONFIG_FILE..."
  sed -i "/proxy:/a \ \ /dora/api:\n    target: $DORA_API_URL" "$CONFIG_FILE"
fi

# Add the root 'dora' property with required and optional fields
if ! grep -q "dora:" "$CONFIG_FILE"; then
  echo "Adding dora root property in $CONFIG_FILE..."
  cat <<EOL >> "$CONFIG_FILE"

dora:
  dataEndpoint: "data"
  teamListEndpoint: "teams"
  daysToFetch: 365
  includeWeekends: false
  showDetails: true
  showTrendGraph: true
  showIndividualTrends: false
  rankThresholds:
    deployment_frequency:
      elite: 24
      high: 168
      medium: 720
    change_lead_time:
      elite: 24
      high: 168
      medium: 720
    change_failure_rate:
      elite: 5
      high: 10
      medium: 45
    recover_time:
      elite: 1
      high: 24
      medium: 168
EOL
fi

echo "Installation Complete"
echo "If you would like to change the plugin configuration, please update the "$CONFIG_FILE" dora section"