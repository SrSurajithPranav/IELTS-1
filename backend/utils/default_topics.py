"""Starter IELTS speaking questions for a new Topic Bank."""

DEFAULT_TOPICS = [
    (1, "Let's talk about your hometown. What do you like most about it?"),
    (1, "Do you work or are you a student? Why did you choose that?"),
    (1, "How often do you use public transport? Why?"),
    (1, "What kind of food do you enjoy eating at home?"),
    (1, "Do you prefer to spend your free time indoors or outdoors?"),
    (1, "How do you usually keep in touch with your friends?"),
    (2, "Describe a person who has influenced you. You should say who they are, how you know them, what they did, and why they influenced you."),
    (2, "Describe a place you visited that you would like to go back to. You should say where it is, when you went, what you did, and why you want to return."),
    (2, "Describe a skill you learned that was difficult. You should say what it was, how you learned it, why it was hard, and how you feel about it now."),
    (2, "Describe a book or film that taught you something. You should say what it was, when you read or watched it, what it was about, and what you learned."),
    (2, "Describe a time you helped someone. You should say who it was, how you helped, why they needed help, and how you felt afterwards."),
    (3, "How has technology changed the way people learn languages?"),
    (3, "Do you think children should be taught to manage money at school? Why?"),
    (3, "What are the advantages and disadvantages of living in a big city?"),
    (3, "Why do some people prefer working from home, and what problems can it cause?"),
    (3, "How might travel and tourism change in the next twenty years?"),
]


def seed_default_topics(db, created_by):
    from models.speaking_topic import SpeakingTopic

    if SpeakingTopic.query.count() > 0:
        return 0
    for part, question in DEFAULT_TOPICS:
        db.session.add(SpeakingTopic(part=part, question=question, created_by=created_by))
    db.session.commit()
    return len(DEFAULT_TOPICS)