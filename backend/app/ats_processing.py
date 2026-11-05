"""Stateless ATS scoring and job-match processing."""

import math
import re
from collections import Counter
from typing import Any


STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "your", "will", "have",
    "are", "you", "our", "their", "about", "into", "over", "more", "other",
    "some", "such", "than", "then", "them", "these", "they", "what", "when",
    "where", "which", "while", "who", "whom", "been", "were", "was", "has",
    "had", "must", "should", "could", "would", "able", "role", "team", "work",
    "working", "looking", "candidate", "join", "company", "position", "years",
    "experience", "strong", "good", "great", "using", "across",
}
STANDARD_KEYWORDS = [
    "python", "javascript", "typescript", "react", "sql", "mysql", "postgresql",
    "docker", "aws", "git", "github", "rest api", "data analysis",
    "machine learning", "agile", "html", "css", "tailwind", "node.js", "linux",
]
ACTION_VERBS = [
    "built", "developed", "engineered", "architected", "created", "designed",
    "implemented", "optimized", "spearheaded", "led", "managed", "accelerated",
    "delivered", "reduced", "increased", "automated", "launched", "collaborated",
]


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"\b[a-z][a-z0-9+#.-]{1,22}\b", text.lower())
    return [token for token in tokens if token not in STOP_WORDS]


def calculate_job_match(resume_text: str, job_description: str) -> dict[str, Any]:
    resume_tokens = _tokenize(resume_text)
    job_tokens = _tokenize(job_description)
    if not resume_tokens or not job_tokens:
        return {
            "matchScore": 0,
            "tfidfCosineSimilarity": 0.0,
            "matchedKeywords": [],
            "missingKeywords": [],
            "recommendations": [
                "Add readable resume and job-description text to calculate a match.",
                "Use accurate, role-specific skills and experience terms.",
            ],
        }

    resume_counts = Counter(resume_tokens)
    job_counts = Counter(job_tokens)
    vocabulary = resume_counts.keys() | job_counts.keys()
    dot_product = 0.0
    resume_norm = 0.0
    job_norm = 0.0

    for term in vocabulary:
        resume_tf = resume_counts[term] / len(resume_tokens)
        job_tf = job_counts[term] / len(job_tokens)
        document_frequency = int(term in resume_counts) + int(term in job_counts)
        inverse_document_frequency = math.log(3 / (1 + document_frequency)) + 1
        resume_weight = resume_tf * inverse_document_frequency
        job_weight = job_tf * inverse_document_frequency
        dot_product += resume_weight * job_weight
        resume_norm += resume_weight**2
        job_norm += job_weight**2

    cosine_similarity = (
        round(dot_product / (math.sqrt(resume_norm) * math.sqrt(job_norm)), 4)
        if resume_norm and job_norm
        else 0.0
    )
    ranked_terms = sorted(
        ((term, count) for term, count in job_counts.items() if len(term) >= 3),
        key=lambda item: (-item[1], item[0]),
    )
    matched = [term for term, _ in ranked_terms if term in resume_counts]
    missing = [term for term, _ in ranked_terms if term not in resume_counts]
    top_job_terms = ranked_terms[:16]
    overlap = (
        sum(term in resume_counts for term, _ in top_job_terms) / len(top_job_terms)
        if top_job_terms
        else 0.0
    )
    score = min(98, max(0, round(cosine_similarity * 45 + overlap * 55)))

    recommendations = []
    if missing:
        recommendations.append(
            "Include relevant missing terms only where they accurately describe your experience: "
            + ", ".join(term.upper() for term in missing[:3])
            + "."
        )
    else:
        recommendations.append(
            "Your resume vocabulary aligns with the supplied job description; support key skills with specific outcomes."
        )
    recommendations.extend(
        [
            "Prioritize the most relevant experience and skills near the top of your resume.",
            "Use concise accomplishment bullets with measurable results where accurate.",
        ]
    )
    return {
        "matchScore": score,
        "tfidfCosineSimilarity": cosine_similarity,
        "matchedKeywords": [term.upper() for term in matched[:10]],
        "missingKeywords": [term.upper() for term in missing[:8]],
        "recommendations": recommendations,
    }


def analyze_resume(resume_text: str, job_description: str = "") -> dict[str, Any]:
    text = resume_text.strip()
    lower = text.lower()
    job_lower = job_description.lower()
    word_count = len(text.split())
    char_count = len(text)

    has_email = bool(re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text))
    has_phone = bool(re.search(r"(?:\+?\d{1,3}[- ]?)?\(?\d{3,5}\)?[- ]?\d{3,5}", text))
    has_linkedin = "linkedin" in lower
    has_github = "github" in lower or "portfolio" in lower
    has_summary = any(label in lower for label in ("summary", "profile", "about", "objective"))
    has_skills = any(label in lower for label in ("skill", "technolog", "competenc", "stack"))
    has_experience = any(label in lower for label in ("experience", "employment", "work history", "projects"))
    has_education = any(
        label in lower
        for label in ("education", "degree", "university", "college", "bachelor", "master")
    )

    format_score = 15 - (4 if char_count < 350 else 0) - (3 if char_count > 7000 else 0)
    section_score = 5 * sum((has_email, has_summary, has_skills, has_experience, has_education))
    keywords = STANDARD_KEYWORDS
    if len(job_lower) > 25:
        job_terms = list(dict.fromkeys(_tokenize(job_description)))
        useful_terms = [term for term in job_terms if len(term) >= 5][:16]
        if useful_terms:
            keywords = useful_terms
    found_keywords = [keyword.upper() for keyword in keywords if keyword in lower]
    missing_keywords = [keyword.upper() for keyword in keywords if keyword not in lower]
    keyword_score = round(25 * len(found_keywords) / max(1, len(keywords)))

    found_verbs = [verb for verb in ACTION_VERBS if verb in lower]
    metric_matches = re.findall(
        r"\b(?:\d+%(?:\s+growth|\s+increase|\s+reduction)?|\$\d+k?|\d+x|\d+\s*\+?|\d+\s*(?:users|clients|projects|features))\b",
        text,
        flags=re.IGNORECASE,
    )
    action_score = min(15, max(4, min(8, round(len(found_verbs) / 5 * 8)) + min(7, round(len(metric_matches) / 3 * 7))))
    readability_score = max(4, 10 - (4 if word_count < 260 else 0) - (3 if word_count > 950 else 0))
    contact_score = (3 if has_email else 0) + (3 if has_phone else 0) + (2 if has_linkedin else 0) + (2 if has_github else 0)

    breakdown = [
        {"category": "Formatting & Structure", "score": format_score, "maxScore": 15, "icon": "Layout"},
        {"category": "Section Completeness", "score": section_score, "maxScore": 25, "icon": "CheckSquare"},
        {"category": "Keyword Match", "score": keyword_score, "maxScore": 25, "icon": "Target"},
        {"category": "Action Verbs & Achievements", "score": action_score, "maxScore": 15, "icon": "Zap"},
        {"category": "Readability & Length", "score": readability_score, "maxScore": 10, "icon": "FileText"},
        {"category": "Contact Info Check", "score": contact_score, "maxScore": 10, "icon": "Mail"},
    ]
    score = min(98, max(32, sum(item["score"] for item in breakdown)))
    score_label = "Excellent" if score >= 85 else "Good" if score >= 70 else "Needs Work" if score >= 50 else "Poor"
    score_color = "green" if score >= 70 else "orange" if score >= 50 else "red"

    issues = []
    if not has_linkedin or not has_github:
        issues.append({
            "id": "iss-contact",
            "category": "Contact Info Check",
            "severity": "warning",
            "message": "A LinkedIn profile or portfolio link may be missing.",
            "fixRecommendation": "Add accurate professional profile links to your contact section if available.",
        })
    if len(metric_matches) < 2:
        issues.append({
            "id": "iss-metrics",
            "category": "Action Verbs & Achievements",
            "severity": "critical",
            "message": "Few quantified achievements were detected.",
            "fixRecommendation": "Add measurable outcomes to relevant accomplishments when you can support them.",
        })
    if not has_summary:
        issues.append({
            "id": "iss-summary",
            "category": "Section Completeness",
            "severity": "critical",
            "message": "A professional summary section was not detected.",
            "fixRecommendation": "Add a concise summary describing your actual skills, experience, and target role.",
        })
    if len(missing_keywords) > 3:
        issues.append({
            "id": "iss-keywords",
            "category": "Keyword Match",
            "severity": "warning",
            "message": f"{len(missing_keywords)} selected job-related keywords were not detected.",
            "fixRecommendation": "Add relevant missing terms only when they accurately reflect your background.",
        })
    if word_count > 950:
        issues.append({
            "id": "iss-length",
            "category": "Readability & Length",
            "severity": "tip",
            "message": "The resume is lengthy.",
            "fixRecommendation": "Prioritize relevant experience and remove repetitive details.",
        })
    else:
        issues.append({
            "id": "iss-format",
            "category": "Formatting & Structure",
            "severity": "tip",
            "message": "Keep the document structure simple for reliable parsing.",
            "fixRecommendation": "Avoid layout elements that may prevent text extraction.",
        })

    suggestions = [
        {
            "section": "Professional Summary",
            "issue": "A focused summary can make relevant qualifications easier to find.",
            "fix": "Describe your specialization and most relevant skills using accurate details.",
            "example_rewrite": {
                "before": "",
                "after": "Summarize your relevant experience, core skills, and the value you bring to the target role.",
            },
        },
        {
            "section": "Experience & Projects",
            "issue": "Some accomplishments may not show their measurable impact.",
            "fix": "Start bullets with clear action verbs and add verified outcomes where available.",
            "example_rewrite": {
                "before": "",
                "after": "Describe the action, the tools used, and a measurable result when one is known.",
            },
        },
        {
            "section": "Skills Organization",
            "issue": "Grouped skills can be easier to scan.",
            "fix": "Organize related skills under accurate, concise headings.",
            "example_rewrite": {
                "before": "",
                "after": "Languages: [relevant languages] | Frameworks: [relevant frameworks] | Tools: [relevant tools]",
            },
        },
    ]

    return {
        "score": score,
        "scoreLabel": score_label,
        "scoreColor": score_color,
        "breakdown": breakdown,
        "foundKeywords": found_keywords[:20],
        "missingKeywords": missing_keywords[:20],
        "issues": issues,
        "aiSuggestions": {
            "score_improvement_estimate": min(20, max(0, 100 - score)),
            "suggestions": suggestions,
            "rewritten_summary": "",
            "missing_keywords": missing_keywords[:6],
        },
        "wordCount": word_count,
        "charCount": char_count,
    }
