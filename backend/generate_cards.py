import json
import os

MAJOR_ARCANA = [
    ("major_0", "The Fool", "New beginnings, innocence, spontaneity, a free spirit", "Recklessness, risk-taking, inconsideration"),
    ("major_1", "The Magician", "Manifestation, resourcefulness, power, inspired action", "Illusion, manipulation, untapped talent, poor planning"),
    ("major_2", "The High Priestess", "Intuition, sacred knowledge, divine feminine, the subconscious mind", "Secrets, disconnected from intuition, withdrawal and silence"),
    ("major_3", "The Empress", "Femininity, beauty, nature, nurturing, abundance", "Creative block, dependence on others, emptiness, smothering"),
    ("major_4", "The Emperor", "Authority, structure, control, fatherhood, leadership", "Tyranny, rigidity, coldness, lack of discipline"),
    ("major_5", "The Hierophant", "Spiritual wisdom, religious beliefs, conformity, tradition, institutions", "Personal beliefs, freedom, challenging the status quo, rebellion"),
    ("major_6", "The Lovers", "Love, harmony, relationships, values alignment, choices", "Self-love, disharmony, imbalance, misalignment of values"),
    ("major_7", "The Chariot", "Control, willpower, success, action, determination", "Self-discipline, lack of direction, aggression, obstacles"),
    ("major_8", "Strength", "Strength, courage, persuasion, influence, compassion", "Inner strength, self-doubt, low energy, raw emotion"),
    ("major_9", "The Hermit", "Soul-searching, introspection, being alone, inner guidance", "Isolation, loneliness, withdrawal, rejection of guidance"),
    ("major_10", "Wheel of Fortune", "Good luck, karma, life cycles, destiny, a turning point", "Bad luck, resistance to change, breaking cycles"),
    ("major_11", "Justice", "Justice, fairness, truth, cause and effect, law", "Unfairness, lack of accountability, dishonesty"),
    ("major_12", "The Hanged Man", "Pause, surrender, letting go, new perspectives", "Delays, resistance, stalling, indecision"),
    ("major_13", "Death", "Endings, change, transformation, transition", "Resistance to change, personal transformation, inner purging"),
    ("major_14", "Temperance", "Balance, moderation, patience, purpose, harmony", "Imbalance, excess, self-healing, re-alignment"),
    ("major_15", "The Devil", "Shadow self, attachment, addiction, restriction, sexuality", "Releasing limiting beliefs, exploring dark thoughts, detachment"),
    ("major_16", "The Tower", "Sudden change, upheaval, chaos, revelation, awakening", "Personal transformation, fear of change, averting disaster"),
    ("major_17", "The Star", "Hope, faith, purpose, renewal, spirituality", "Lack of faith, despair, self-trust, disconnection"),
    ("major_18", "The Moon", "Illusion, fear, anxiety, subconscious, intuition", "Release of fear, repressed emotion, inner confusion"),
    ("major_19", "The Sun", "Positivity, fun, warmth, success, vitality", "Inner child, feeling down, overly optimistic, temporary depression"),
    ("major_20", "Judgement", "Judgement, rebirth, inner calling, absolution", "Self-doubt, inner critic, ignoring the call"),
    ("major_21", "The World", "Completion, integration, accomplishment, travel", "Seeking personal closure, short-cuts, delays")
]

SUITS_DATA = {
    "wands": {
        "theme": "fire, passion, willpower, creativity",
        "cards": [
            ("Ace of Wands", "Inspiration, creative spark, new passion, enthusiasm", "Lack of energy, hesitation, creative blocks, delays"),
            ("Two of Wands", "Future planning, progress, decisions, discovery", "Fear of unknown, lack of planning, playing safe"),
            ("Three of Wands", "Expansion, foresight, overseas opportunities, progress", "Playing small, lack of foresight, unexpected delays"),
            ("Four of Wands", "Celebration, joy, harmony, relaxation, homecoming", "Personal celebration, tension at home, transient harmony"),
            ("Five of Wands", "Conflict, disagreements, competition, tension, diversity", "Conflict avoidance, diversity, tension release"),
            ("Six of Wands", "Success, public recognition, progress, self-confidence", "Private achievement, fall from grace, egotism"),
            ("Seven of Wands", "Challenge, competition, protection, perseverance", "Exhaustion, giving up, overwhelmed by competition"),
            ("Eight of Wands", "Movement, fast pace, progress, rapid action, alignment", "Delays, frustration, resisting flow, internal panic"),
            ("Nine of Wands", "Resilience, courage, persistence, test of faith, boundaries", "Inner strength, struggle, overwhelmed, defensiveness"),
            ("Ten of Wands", "Burden, extra responsibility, hard work, stress", "Doing it all, carrying the burden alone, burnout"),
            ("Page of Wands", "Inspiration, ideas, discovery, boundless potential, free spirit", "Newly-formed ideas, redirecting energy, self-limiting beliefs"),
            ("Knight of Wands", "Energy, passion, inspired action, adventure, impulsiveness", "Passion project, haste, scattered energy, recklessness"),
            ("Queen of Wands", "Courage, confidence, independence, social butterfly, determination", "Self-respect, introversion, re-establishing confidence"),
            ("King of Wands", "Natural leader, vision, entrepreneur, honor, big picture", "Impulsiveness, haste, ruthless, high expectations")
        ]
    },
    "cups": {
        "theme": "water, emotion, relationships, intuition",
        "cards": [
            ("Ace of Cups", "Love, new feelings, emotional awakening, intuition, spirituality", "Self-love, intuition, repressed emotions, emotional draining"),
            ("Two of Cups", "Unified love, partnership, mutual attraction, connection", "Self-love, break-ups, disharmony, distrust"),
            ("Three of Cups", "Celebration, friendship, creativity, collaborations", "Independence, solitary celebrations, gossip, over-indulgence"),
            ("Four of Cups", "Meditation, contemplation, apathy, re-evaluation", "Sudden awareness, choosing happiness, acceptance"),
            ("Five of Cups", "Regret, failure, disappointment, pessimism", "Personal setbacks, self-forgiveness, moving on"),
            ("Six of Cups", "Revisiting the past, childhood memories, innocence, joy", "Living in the past, forgiveness, lack of playfulness"),
            ("Seven of Cups", "Opportunities, choices, wishful thinking, illusion", "Alignment, personal values, overwhelmed by choices"),
            ("Eight of Cups", "Disappointment, abandonment, withdrawal, searching for truth", "Trying one more time, indecision, aimless drifting"),
            ("Nine of Cups", "Contentment, satisfaction, gratitude, wish come true", "Inner happiness, materialism, dissatisfaction"),
            ("Ten of Cups", "Divine love, blissful relationships, harmony, alignment", "Disconnection, misaligned values, struggling relationships"),
            ("Page of Cups", "Creative opportunities, intuitive messages, curiosity, possibility", "New ideas, doubting intuition, creative blocks"),
            ("Knight of Cups", "Creativity, romance, charm, imagination, beauty", "Overactive imagination, unrealistic, moodiness"),
            ("Queen of Cups", "Compassionate, caring, emotionally stable, intuitive", "Inner feelings, self-care, emotional boundary-setting"),
            ("King of Cups", "Emotionally balanced, compassionate, diplomatic", "Emotional manipulation, moodiness, volatility")
        ]
    },
    "swords": {
        "theme": "air, intellect, communication, truth",
        "cards": [
            ("Ace of Swords", "Breakthroughs, new ideas, mental clarity, success", "Inner clarity, re-thinking an idea, clouded judgement"),
            ("Two of Swords", "Difficult decisions, weighing options, impasse, avoidance", "Indecision, confusion, information overload"),
            ("Three of Swords", "Heartbreak, emotional pain, sorrow, grief, hurt", "Negative self-talk, releasing pain, optimism, forgiveness"),
            ("Four of Swords", "Rest, relaxation, meditation, contemplation, recuperation", "Exhaustion, burnout, deep rest, stagnation"),
            ("Five of Swords", "Conflict, disagreements, competition, defeat, winning at all costs", "Reconciliation, making amends, past resentment"),
            ("Six of Swords", "Transition, change, rite of passage, releasing baggage", "Personal transition, resistance to change, unresolved issues"),
            ("Seven of Swords", "Betrayal, deception, getting away with something, stealth", "Imposter syndrome, deceit, keeping secrets"),
            ("Eight of Swords", "Negative thoughts, self-imposed restriction, imprisonment", "Self-limiting beliefs, inner critic, releasing tension"),
            ("Nine of Swords", "Anxiety, worry, fear, depression, nightmares", "Inner turmoil, deep-seated fears, secrets, release"),
            ("Ten of Swords", "Painful endings, deep wounds, betrayal, loss, crisis", "Recovery, regeneration, resisting an inevitable end"),
            ("Page of Swords", "New ideas, curiosity, thirst for knowledge, new ways of communicating", "Self-expression, all talk and no action, haphazard action"),
            ("Knight of Swords", "Ambitious, action-oriented, driven to succeed, fast-thinking", "Restless, unfocused, impulsive, burn-out"),
            ("Queen of Swords", "Independent, unbiased judgement, clear boundaries, direct", "Overly emotional, easily influenced, bitchy, cold-hearted"),
            ("King of Swords", "Mental clarity, intellectual power, authority, truth", "Quiet power, inner truth, misuse of power, manipulation")
        ]
    },
    "pentacles": {
        "theme": "earth, finances, career, physical realm, manifestation",
        "cards": [
            ("Ace of Pentacles", "A new financial or career opportunity, manifestation, abundance", "Lost opportunity, lack of planning and foresight"),
            ("Two of Pentacles", "Multiple priorities, time management, prioritization, adaptability", "Over-committed, disorganisation, reprioritisation"),
            ("Three of Pentacles", "Collaboration, teamwork, learning, implementation", "Disharmony, working alone, misalignment"),
            ("Four of Pentacles", "Saving money, security, conservatism, scarcity, control", "Over-spending, greed, self-protection"),
            ("Five of Pentacles", "Financial loss, poverty, lack mindset, isolation, worry", "Recovery from financial loss, spiritual poverty"),
            ("Six of Pentacles", "Giving, receiving, sharing wealth, generosity, charity", "Self-care, unpaid debt, one-sided charity"),
            ("Seven of Pentacles", "Long-term view, sustainable results, perseverance, investment", "Lack of long-term vision, limited success"),
            ("Eight of Pentacles", "Apprenticeship, repetitive tasks, mastery, skill development", "Self-development, perfectionism, misdirected activity"),
            ("Nine of Pentacles", "Abundance, luxury, self-sufficiency, financial independence", "Self-worth, over-investment in work, hustling"),
            ("Ten of Pentacles", "Wealth, financial security, family, long-term success, contribution", "The dark side of wealth, financial failure or loss"),
            ("Page of Pentacles", "Manifestation, financial opportunity, skill development", "Lack of progress, procrastination, learn from failure"),
            ("Knight of Pentacles", "Hard work, productivity, routine, conservatism", "Self-discipline, boredom, feeling 'stuck', perfectionism"),
            ("Queen of Pentacles", "Nurturing, practical, providing financially, a working parent", "Financial independence, self-care, work-home conflict"),
            ("King of Pentacles", "Wealth, business, leadership, security, discipline, abundance", "Financially inept, obsessed with wealth and status, stubborn")
        ]
    }
}

all_cards = []

# Major Arcana (22 cards)
for card_id, name, upright, reversed_meaning in MAJOR_ARCANA:
    all_cards.append({
        "id": card_id,
        "name": name,
        "arcana": "major",
        "suit": None,
        "upright": upright,
        "reversed": reversed_meaning
    })

# Minor Arcana (56 cards)
rank_slugs = ["ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king"]

for suit_name, suit_info in SUITS_DATA.items():
    for idx, (card_name, upright, reversed_meaning) in enumerate(suit_info["cards"]):
        slug = rank_slugs[idx]
        card_id = f"{suit_name}_{slug}"
        all_cards.append({
            "id": card_id,
            "name": card_name,
            "arcana": "minor",
            "suit": suit_name,
            "upright": upright,
            "reversed": reversed_meaning
        })

print(f"Total cards created: {len(all_cards)}")
assert len(all_cards) == 78, f"Expected 78 cards, got {len(all_cards)}"

base_dir = "/Users/dariyazhaxylykova/.gemini/antigravity/scratch/tarot-ai"
paths = [
    os.path.join(base_dir, "backend/app/data/cards.json"),
    os.path.join(base_dir, "parser/cards.json")
]

for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(all_cards, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(all_cards)} cards to {p}")
