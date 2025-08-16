import plotly.express as px
import pandas as pd

# Create the complete data from the provided JSON
data = {
    'group': [
        'High nobility',
        'Middle nobility', 
        'Clergy',
        'Urban patric.',
        'Artisans/merch.',
        'Peasants',
        'Conversos',
        'Moriscos'
    ],
    'percentage': [1, 10, 5, 2, 15, 60, 3, 4]
}

df = pd.DataFrame(data)

# Use historically appropriate colors - earth tones, deep reds, blues, and golds
historical_colors = ['#8B4513', '#CD853F', '#B22222', '#4682B4', '#DAA520', '#654321', '#A0522D', '#2F4F4F']

fig = px.pie(df, 
             values='percentage', 
             names='group',
             title='Social Structure of 16th Century Spain',
             color_discrete_sequence=historical_colors)

# Update layout for pie chart specific requirements
fig.update_layout(uniformtext_minsize=14, uniformtext_mode='hide')

# Update traces to show percentages and use outside positioning for better readability
fig.update_traces(textposition='auto', textinfo='percent')

# Save the chart
fig.write_image('spain_social_structure.png')