# Sample events — mirrors the JCC Kidz design reference.
# Run with: bundle exec rails db:seed

Kidspire::Event.destroy_all

Kidspire::Event.create!([
  {
    title:       "Vacation Bible School: Kingdom Quest",
    description: "A week of worship, games, crafts, and Bible adventures for the whole family! Kids explore the Kingdom of God through interactive stations, team challenges, and daily devotions.",
    location:    "JCC Life Center",
    event_date:  Time.zone.parse("2026-06-16 09:00:00"),
    age_min:     3,
    age_max:     12,
    capacity:    120,
  },
  {
    title:       "Royal Rangers Family Campout",
    description: "Two nights under the stars with games, fishing, devotions, and s'mores. Bring the whole family for a weekend of adventure and faith-building memories.",
    location:    "Camp Cedar Pines",
    event_date:  Time.zone.parse("2026-05-10 08:00:00"),
    age_min:     5,
    age_max:     14,
    capacity:    80,
  },
  {
    title:       "Kids Worship Night",
    description: "An evening of high-energy worship led by our Kids Ministry team. Kids lead, sing, and encounter God in a powerful atmosphere designed just for them.",
    location:    "Main Auditorium",
    event_date:  Time.zone.parse("2026-05-02 18:30:00"),
    age_min:     5,
    age_max:     14,
    capacity:    200,
  },
  {
    title:       "Nursery Parent Playdate",
    description: "Meet other nursery families over coffee while the littles play. A relaxed morning to connect, share, and build community with parents in the same season of life.",
    location:    "Nursery Wing",
    event_date:  Time.zone.parse("2026-05-24 10:00:00"),
    age_min:     0,
    age_max:     2,
    capacity:    30,
  },
  {
    title:       "Preteen Pizza & Games",
    description: "Pizza, board games, and a short devotional just for preteens. A fun space for 5th and 6th graders to hang out, laugh, and go deeper together.",
    location:    "Youth Loft",
    event_date:  Time.zone.parse("2026-05-17 17:00:00"),
    age_min:     10,
    age_max:     14,
    capacity:    40,
  },
  {
    title:       "Sunday Kids Church",
    description: "High-energy worship, a meaningful lesson, and small groups every Sunday. Kids are grouped by age for age-appropriate teaching and community.",
    location:    "Kids Wing",
    event_date:  Time.zone.parse("2026-05-05 09:00:00"),
    age_min:     2,
    age_max:     11,
    capacity:    nil,
  },
  {
    title:       "Family Bible Challenge",
    description: "A fun, competitive Bible trivia night for the whole family. Teams compete in rounds of scripture knowledge, worship, and creativity challenges.",
    location:    "Fellowship Hall",
    event_date:  Time.zone.parse("2026-06-07 18:00:00"),
    age_min:     5,
    age_max:     nil,
    capacity:    100,
  },
])

puts "✅ Seeded #{Kidspire::Event.count} events"
