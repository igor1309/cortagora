import pandas as pd

# Создаю таблицу ключевых исторических персонажей 1520-1530х годов
historical_figures = {
    'Name': [
        'Karl V Habsburg',
        'Pope Clement VII (Giulio Medici)',
        'Pope Adrian VI',
        'Cardinal Juan Pardo de Tavera',
        'Francisco de Vitoria',
        'Juan de Avila',
        'Francisco Jimenez de Cisneros',
        'Ignatius Loyola',
        'Juan Padilla',
        'Francis I of France'
    ],
    'Years': [
        '1500-1558',
        '1478-1534',
        '1459-1523',
        '1472-1545',
        'c. 1483-1546',
        '1499-1569',
        '1436-1517',
        '1491-1556',
        '1490-1521',
        '1494-1547'
    ],
    'Position': [
        'Holy Roman Emperor, King of Spain',
        'Pope (1523-1534)',
        'Pope (1522-1523)',
        'Archbishop of Toledo, Cardinal, Grand Inquisitor',
        'Dominican theologian, Salamanca professor',
        'Priest, preacher, mystic',
        'Cardinal, Archbishop of Toledo, Grand Inquisitor',
        'Founder of Jesuit Order',
        'Leader of Comuneros revolt',
        'King of France'
    ],
    'Role_in_Era': [
        'Ruler of vast empire, fighter against Protestantism',
        'Political crises, Sack of Rome 1527',
        'Church reform attempts, fight against corruption',
        'Influential churchman, shadow curator of Inquisition',
        'Founder of Salamanca school, international law',
        'Preacher, reformer, apostle of Andalusia',
        'Creator of Complutensian Polyglot, reformer',
        'Mystic, creator of Spiritual Exercises',
        'Defender of urban liberties against absolutism',
        'Opponent of Charles V in Italian Wars'
    ]
}

df_figures = pd.DataFrame(historical_figures)
print("Key Historical Figures of the 1520s-1530s:")
print(df_figures.to_string(index=False))

# Сохраняю в CSV
df_figures.to_csv('historical_figures_1520s.csv', index=False)
print("\n✓ Table saved as 'historical_figures_1520s.csv'")