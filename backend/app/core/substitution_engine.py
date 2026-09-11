import json
import math
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import List, Dict, Optional, Set, Tuple, Any
from sqlmodel import Session, select, func

from models import (
    User,
    UserProfile,
    Timetable,
    SubjectClassAssignment,
    TeacherAbsence,
    SubstitutionRecord,
    SubstitutionSettings,
)


@dataclass
class TeacherCandidate:
    id: str
    name: str
    email: str
    image: Optional[str]
    role: str
    category: str  # 'PRT', 'TGT', 'PGT'
    subjects: Set[str] = field(default_factory=set)
    classes: Set[str] = field(default_factory=set)
    sections: Set[Tuple[str, str]] = field(default_factory=set)
    activity_skills: Set[str] = field(default_factory=set)
    is_available_for_substitution: bool = True
    timetable_slots: List[Dict[str, Any]] = field(default_factory=list)
    daily_substitution_count: int = 0


@dataclass
class SubstitutionRequirement:
    id: str
    date: str  # YYYY-MM-DD
    day_of_week: str
    timetable_id: Optional[str]
    absence_id: Optional[str]
    period_name: str
    start_time: str
    end_time: str
    class_: str
    section: str
    subject: str
    room: Optional[str]
    original_teacher_id: str
    original_teacher_name: str
    required_category: str


def normalize_subject(subj: str) -> str:
    """Normalize subject string for comparison (e.g. 'math' vs 'Mathematics')."""
    if not subj:
        return ""
    clean = subj.strip().lower()
    mapping = {
        "math": "mathematics",
        "maths": "mathematics",
        "sci": "science",
        "eng": "english",
        "sst": "social studies",
        "soc": "social studies",
        "csc": "computer science",
        "comp": "computer science",
        "cs": "computer science",
        "phy": "physics",
        "chem": "chemistry",
        "bio": "biology",
        "hnd": "hindi",
        "pe": "games / sports",
        "sports": "games / sports",
        "games": "games / sports",
        "art": "arts",
    }
    return mapping.get(clean, clean)


def class_to_required_category(class_name: str) -> str:
    """Map class to required teacher category (PRT, TGT, PGT)."""
    c = str(class_name).strip().upper()
    if c in ["11", "12"]:
        return "PGT"
    elif c in ["6", "7", "8", "9", "10"]:
        return "TGT"
    else:
        # Nursery, KG, 1, 2, 3, 4, 5
        return "PRT"


def parse_time_to_minutes(time_str: str) -> int:
    """Convert 'HH:MM' 24-hr time string to integer minutes since midnight."""
    try:
        parts = time_str.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0


def is_time_overlap(s1: str, e1: str, s2: str, e2: str) -> bool:
    """Check if two time intervals [s1, e1] and [s2, e2] overlap."""
    m_s1, m_e1 = parse_time_to_minutes(s1), parse_time_to_minutes(e1)
    m_s2, m_e2 = parse_time_to_minutes(s2), parse_time_to_minutes(e2)
    return max(m_s1, m_s2) < min(m_e1, m_e2)


def get_default_settings(db: Session) -> SubstitutionSettings:
    """Fetch substitution settings or create default."""
    settings = db.query(SubstitutionSettings).filter(SubstitutionSettings.id == "default").first()
    if not settings:
        settings = SubstitutionSettings(id="default")
        db.add(settings)
        try:
            db.commit()
            db.refresh(settings)
        except Exception:
            db.rollback()
    return settings


class SubstitutionEngine:
    """
    Intelligent Teacher Absence and Substitute Teacher Allocation Engine.
    Implements hard constraints, multi-attribute configurable scoring,
    global period-conflict optimization, and activity fallback.
    """

    def __init__(self, db: Session, settings: Optional[SubstitutionSettings] = None):
        self.db = db
        self.settings = settings or get_default_settings(db)

    def load_teacher_candidates(self, date_str: str, day_of_week: str) -> Dict[str, TeacherCandidate]:
        """
        Build structured information for every active teacher/staff in the school:
        - Category: PRT, TGT, PGT
        - Subjects taught
        - Classes & sections taught
        - Activity skills
        - Availability & timetable
        - Current substitution count for this date
        """
        # Fetch all teachers, librarians, and staff
        users = self.db.query(User).filter(User.role.in_(["teacher", "librarian", "admin"])).all()
        user_ids = [u.id for u in users]
        if not user_ids:
            return {}

        profiles = self.db.query(UserProfile).filter(UserProfile.user_id.in_(user_ids)).all()
        profile_map = {p.user_id: p for p in profiles}

        # Timetable slots for this day of week
        timetable_rows = self.db.query(Timetable).filter(
            Timetable.teacher_id.in_(user_ids),
            func.lower(Timetable.day_of_week) == day_of_week.lower()
        ).all()

        tt_map: Dict[str, List[Dict[str, Any]]] = {}
        for row in timetable_rows:
            tt_map.setdefault(row.teacher_id, []).append({
                "id": row.id,
                "class": row.class_,
                "section": row.section,
                "subject": row.subject,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "room": row.room,
            })

        # Subject class assignments
        assignments = self.db.query(SubjectClassAssignment).filter(
            SubjectClassAssignment.teacher_id.in_(user_ids)
        ).all()
        asgn_map: Dict[str, List[SubjectClassAssignment]] = {}
        for a in assignments:
            asgn_map.setdefault(a.teacher_id, []).append(a)

        # Existing substitutions assigned to teachers for this date
        existing_subs = self.db.query(SubstitutionRecord).filter(
            SubstitutionRecord.date == date_str,
            SubstitutionRecord.status.in_(["assigned", "activity_fallback", "manual_override"]),
            SubstitutionRecord.substitute_teacher_id.isnot(None)
        ).all()
        daily_sub_counts: Dict[str, int] = {}
        for s in existing_subs:
            if s.substitute_teacher_id:
                daily_sub_counts[s.substitute_teacher_id] = daily_sub_counts.get(s.substitute_teacher_id, 0) + 1

        candidates: Dict[str, TeacherCandidate] = {}
        for u in users:
            prof = profile_map.get(u.id)
            # Determine teacher category:
            cat = prof.teacher_category if prof and prof.teacher_category else None
            
            # Extract subjects, classes, sections
            user_subjects: Set[str] = set()
            user_classes: Set[str] = set()
            user_sections: Set[Tuple[str, str]] = set()

            for a in asgn_map.get(u.id, []):
                user_subjects.add(normalize_subject(a.subject))
                user_classes.add(str(a.class_).strip())
                user_sections.add((str(a.class_).strip(), str(a.section).strip().upper()))

            for slot in tt_map.get(u.id, []):
                user_subjects.add(normalize_subject(slot["subject"]))
                user_classes.add(str(slot["class"]).strip())
                user_sections.add((str(slot["class"]).strip(), str(slot["section"]).strip().upper()))

            if not cat:
                if any(c in ["11", "12"] for c in user_classes):
                    cat = "PGT"
                elif any(c in ["6", "7", "8", "9", "10"] for c in user_classes):
                    cat = "TGT"
                else:
                    cat = "PRT"

            # Activity skills
            activity_skills: Set[str] = set()
            if prof and prof.activity_skills:
                try:
                    skills_list = json.loads(prof.activity_skills)
                    if isinstance(skills_list, list):
                        activity_skills = {s.strip() for s in skills_list if s}
                except Exception:
                    activity_skills = {s.strip() for s in prof.activity_skills.split(",") if s.strip()}

            # Default activity skills based on role or subjects
            if u.role == "librarian" or "library" in user_subjects:
                activity_skills.add("Library")
            if "computer" in user_subjects or "computer science" in user_subjects:
                activity_skills.add("Computer")
            if "games / sports" in user_subjects or "physical education" in user_subjects:
                activity_skills.add("Games / Sports")
            if "arts" in user_subjects:
                activity_skills.add("Arts")
            if "music" in user_subjects:
                activity_skills.add("Music")

            is_available = prof.is_available_for_substitution if prof is not None else True

            candidate = TeacherCandidate(
                id=u.id,
                name=u.name,
                email=u.email,
                image=u.image,
                role=u.role,
                category=cat,
                subjects=user_subjects,
                classes=user_classes,
                sections=user_sections,
                activity_skills=activity_skills,
                is_available_for_substitution=is_available,
                timetable_slots=tt_map.get(u.id, []),
                daily_substitution_count=daily_sub_counts.get(u.id, 0),
            )
            candidates[u.id] = candidate

        return candidates

    def evaluate_academic_candidate(
        self,
        candidate: TeacherCandidate,
        req: SubstitutionRequirement,
        absent_teacher_ids: Set[str],
        assigned_in_period: Set[str],
    ) -> Tuple[bool, float, Dict[str, float], Optional[str]]:
        """
        Evaluate an academic teacher candidate for a requirement.
        Returns: (is_eligible, score, score_breakdown, exclusion_reason)
        """
        # --- HARD CONSTRAINTS ---
        # 1. Teacher must not be absent
        if candidate.id in absent_teacher_ids:
            return False, -math.inf, {}, "Teacher is marked absent today"

        # 2. Teacher must not be the absent teacher themselves
        if candidate.id == req.original_teacher_id:
            return False, -math.inf, {}, "Cannot assign teacher to substitute for themselves"

        # 3. Teacher must be available for substitution
        if not candidate.is_available_for_substitution:
            return False, -math.inf, {}, "Teacher is marked unavailable for substitution"

        # 4. Teacher must not already be assigned another substitution during this period
        if candidate.id in assigned_in_period:
            return False, -math.inf, {}, "Teacher is already assigned to another class during this period"

        # 5. Teacher must not already have a class during that period in their own timetable
        for slot in candidate.timetable_slots:
            if is_time_overlap(req.start_time, req.end_time, slot["start_time"], slot["end_time"]):
                return False, -math.inf, {}, f"Teacher has regular class {slot['subject']} (Class {slot['class']}-{slot['section']}) at {slot['start_time']}-{slot['end_time']}"

        # 6. Category Eligibility Hard Constraint
        # Respect teacher category: PRT cannot teach PGT or TGT classes.
        # TGT cannot teach PGT classes.
        req_cat = req.required_category
        cand_cat = candidate.category

        if not self.settings.allow_cross_category:
            if req_cat == "PGT" and cand_cat != "PGT":
                return False, -math.inf, {}, f"Teacher category {cand_cat} is not qualified for Senior Secondary PGT class ({req.class_})"
            if req_cat == "TGT" and cand_cat == "PRT":
                return False, -math.inf, {}, f"PRT teacher is not qualified for High School TGT class ({req.class_})"

        # --- SCORING SYSTEM ---
        score = 0.0
        breakdown: Dict[str, float] = {}

        # 1. Same subject bonus (+100)
        norm_req_subject = normalize_subject(req.subject)
        if norm_req_subject in candidate.subjects:
            score += self.settings.same_subject_score
            breakdown["same_subject"] = self.settings.same_subject_score

        # 2. Same category bonus (+50)
        if cand_cat == req_cat:
            score += self.settings.same_category_score
            breakdown["same_category"] = self.settings.same_category_score

        # 3. Already teaches same class (+40)
        if str(req.class_).strip() in candidate.classes:
            score += self.settings.same_class_score
            breakdown["same_class"] = self.settings.same_class_score

        # 4. Already teaches same section (+30)
        if (str(req.class_).strip(), str(req.section).strip().upper()) in candidate.sections:
            score += self.settings.same_section_score
            breakdown["same_section"] = self.settings.same_section_score

        # 5. Workload bonuses and penalties
        current_subs = candidate.daily_substitution_count
        if current_subs == 0:
            score += self.settings.low_workload_bonus
            breakdown["low_workload_bonus"] = self.settings.low_workload_bonus
        else:
            penalty = current_subs * self.settings.workload_penalty_per_sub
            score -= penalty
            breakdown["workload_penalty"] = -penalty

        if current_subs >= self.settings.high_workload_threshold:
            score -= self.settings.high_workload_penalty
            breakdown["high_workload_penalty"] = -self.settings.high_workload_penalty

        return True, score, breakdown, None

    def evaluate_activity_candidate(
        self,
        candidate: TeacherCandidate,
        req: SubstitutionRequirement,
        absent_teacher_ids: Set[str],
        assigned_in_period: Set[str],
        activity_name: str,
    ) -> Tuple[bool, float, Dict[str, float], Optional[str]]:
        """
        Evaluate an activity teacher candidate for an activity fallback period.
        """
        # Basic Hard constraints
        if candidate.id in absent_teacher_ids:
            return False, -math.inf, {}, "Teacher is absent"
        if candidate.id == req.original_teacher_id:
            return False, -math.inf, {}, "Cannot assign absent teacher"
        if not candidate.is_available_for_substitution:
            return False, -math.inf, {}, "Teacher unavailable for substitution"
        if candidate.id in assigned_in_period:
            return False, -math.inf, {}, "Teacher already assigned this period"

        for slot in candidate.timetable_slots:
            if is_time_overlap(req.start_time, req.end_time, slot["start_time"], slot["end_time"]):
                return False, -math.inf, {}, "Teacher has regular class"

        score = 0.0
        breakdown: Dict[str, float] = {}

        # Matching activity skill bonus (+25)
        has_skill = False
        for skill in candidate.activity_skills:
            if skill.lower() in activity_name.lower() or activity_name.lower() in skill.lower():
                has_skill = True
                break

        if has_skill:
            score += self.settings.matching_activity_skill_score
            breakdown["matching_activity_skill"] = self.settings.matching_activity_skill_score

        # Workload bonus/penalty
        current_subs = candidate.daily_substitution_count
        if current_subs == 0:
            score += self.settings.low_workload_bonus
            breakdown["low_workload_bonus"] = self.settings.low_workload_bonus
        else:
            penalty = current_subs * self.settings.workload_penalty_per_sub
            score -= penalty
            breakdown["workload_penalty"] = -penalty

        return True, score, breakdown, None

    def solve_period_bipartite_matching(
        self,
        requirements: List[SubstitutionRequirement],
        candidates: Dict[str, TeacherCandidate],
        absent_teacher_ids: Set[str],
    ) -> Dict[str, Dict[str, Any]]:
        """
        Solve global optimal assignment for a single period where multiple requirements
        might compete for the same teachers.
        No teacher can be assigned more than one requirement in this period.
        Uses exact combinatorial optimization (branch and bound) to maximize total score.
        """
        if not requirements:
            return {}

        req_candidates: Dict[str, List[Tuple[float, str, Dict[str, float]]]] = {}
        for r in requirements:
            eligible_list = []
            for cid, cand in candidates.items():
                is_eligible, score, breakdown, _ = self.evaluate_academic_candidate(
                    candidate=cand,
                    req=r,
                    absent_teacher_ids=absent_teacher_ids,
                    assigned_in_period=set(),
                )
                if is_eligible and score > -math.inf:
                    eligible_list.append((score, cid, breakdown))

            # Sort candidate list descending by score
            eligible_list.sort(key=lambda x: x[0], reverse=True)
            req_candidates[r.id] = eligible_list

        req_ids = [r.id for r in requirements]

        # Exact Branch-and-Bound to find matching that maximizes sum of scores
        best_assignment: Dict[str, Tuple[str, float, Dict[str, float]]] = {}
        best_total_score = -math.inf

        def search(idx: int, current_used_teachers: Set[str], current_score: float, current_matching: Dict[str, Tuple[str, float, Dict[str, float]]]):
            nonlocal best_assignment, best_total_score

            if idx == len(req_ids):
                if current_score > best_total_score:
                    best_total_score = current_score
                    best_assignment = dict(current_matching)
                return

            curr_req_id = req_ids[idx]
            cand_list = req_candidates[curr_req_id]

            # Option A: Try assigning eligible teachers (ordered highest score first)
            matched_any = False
            for score, cid, breakdown in cand_list:
                if cid not in current_used_teachers:
                    matched_any = True
                    current_used_teachers.add(cid)
                    current_matching[curr_req_id] = (cid, score, breakdown)

                    search(idx + 1, current_used_teachers, current_score + score, current_matching)

                    del current_matching[curr_req_id]
                    current_used_teachers.remove(cid)

            # Option B: Leave unassigned / fallback if no candidate could be picked
            if not matched_any or not cand_list:
                search(idx + 1, current_used_teachers, current_score, current_matching)

        search(0, set(), 0.0, {})

        results: Dict[str, Dict[str, Any]] = {}
        for r in requirements:
            if r.id in best_assignment:
                cid, score, breakdown = best_assignment[r.id]
                results[r.id] = {
                    "substitute_teacher_id": cid,
                    "status": "assigned",
                    "is_activity_fallback": False,
                    "activity_name": None,
                    "suitability_score": score,
                    "score_breakdown": breakdown,
                }
            else:
                results[r.id] = {
                    "substitute_teacher_id": None,
                    "status": "unassigned",
                    "is_activity_fallback": False,
                    "activity_name": None,
                    "suitability_score": 0.0,
                    "score_breakdown": {},
                }

        return results

    def run_global_allocation(self, date_str: str) -> List[Dict[str, Any]]:
        """
        Execute complete Teacher Absence & Substitution Allocation Workflow:
        1. Fetch all absent teachers for this date.
        2. Detect all affected timetable slots across all absent teachers.
        3. Collect ALL requirements for the day.
        4. Group by period / time slot.
        5. Apply hard constraints, calculate suitability scores.
        6. Globally assign substitutes (solving period conflicts).
        7. For requirements with no suitable academic substitute, assign activity class fallback.
        8. Balance workload across periods.
        9. Persist/update records in `substitution_record` table.
        10. Return full allocation results.
        """
        # 1. Fetch absent teachers for date
        absences = self.db.query(TeacherAbsence).filter(
            TeacherAbsence.date == date_str,
            TeacherAbsence.status.in_(["absent", "half_day", "on_leave"])
        ).all()

        absent_teacher_ids = {a.teacher_id for a in absences}
        if not absent_teacher_ids:
            return []

        # Parse day of week for the date
        try:
            target_dt = datetime.strptime(date_str, "%Y-%m-%d")
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_of_week = days[target_dt.weekday()]
        except Exception:
            day_of_week = "Monday"

        # 2. Fetch candidates
        candidates = self.load_teacher_candidates(date_str, day_of_week)

        # 3. Fetch timetable slots for all absent teachers for this day of week
        absent_timetable_slots = self.db.query(Timetable, User).join(
            User, Timetable.teacher_id == User.id
        ).filter(
            Timetable.teacher_id.in_(absent_teacher_ids),
            func.lower(Timetable.day_of_week) == day_of_week.lower()
        ).order_by(Timetable.start_time).all()

        # Build requirements list
        requirements: List[SubstitutionRequirement] = []
        absence_by_teacher = {a.teacher_id: a for a in absences}

        for idx, (slot, teacher_user) in enumerate(absent_timetable_slots, 1):
            req_cat = class_to_required_category(slot.class_)
            period_num = f"Period {idx}"
            req_id = f"sub_{date_str}_{slot.id}"
            abs_obj = absence_by_teacher.get(slot.teacher_id)

            requirements.append(SubstitutionRequirement(
                id=req_id,
                date=date_str,
                day_of_week=day_of_week,
                timetable_id=slot.id,
                absence_id=abs_obj.id if abs_obj else None,
                period_name=period_num,
                start_time=slot.start_time,
                end_time=slot.end_time,
                class_=slot.class_,
                section=slot.section,
                subject=slot.subject,
                room=slot.room,
                original_teacher_id=slot.teacher_id,
                original_teacher_name=teacher_user.name,
                required_category=req_cat,
            ))

        if not requirements:
            return []

        # 4. Group requirements by period time (start_time, end_time)
        period_groups: Dict[Tuple[str, str], List[SubstitutionRequirement]] = {}
        for r in requirements:
            key = (r.start_time, r.end_time)
            period_groups.setdefault(key, []).append(r)

        # Parse approved activities list
        try:
            enabled_acts = json.loads(self.settings.enabled_activities)
        except Exception:
            enabled_acts = ["Games / Sports", "Arts", "Music", "Library", "Computer"]

        final_allocations: List[Dict[str, Any]] = []

        # 5. Process period-by-period with global matching and workload propagation
        sorted_periods = sorted(period_groups.keys(), key=lambda p: parse_time_to_minutes(p[0]))

        for p_key in sorted_periods:
            p_reqs = period_groups[p_key]

            # Solve academic matching for this period
            period_results = self.solve_period_bipartite_matching(p_reqs, candidates, absent_teacher_ids)

            assigned_in_this_period: Set[str] = set()
            for r in p_reqs:
                res = period_results.get(r.id, {})
                assigned_sub_id = res.get("substitute_teacher_id")

                # Check if academic allocation is acceptable or needs activity fallback
                needs_activity_fallback = False
                if not assigned_sub_id:
                    needs_activity_fallback = True
                else:
                    score = res.get("suitability_score", 0.0)
                    breakdown = res.get("score_breakdown", {})
                    # If score is below fallback threshold and does not have same subject
                    if score < self.settings.activity_fallback_threshold and "same_subject" not in breakdown:
                        needs_activity_fallback = True

                if needs_activity_fallback:
                    # 6. Activity Class Fallback
                    best_act_candidate = None
                    best_act_score = -math.inf
                    best_act_breakdown = {}
                    best_act_name = None

                    for act in enabled_acts:
                        for cid, cand in candidates.items():
                            if cid in assigned_in_this_period:
                                continue
                            is_elig, a_score, a_bk, _ = self.evaluate_activity_candidate(
                                candidate=cand,
                                req=r,
                                absent_teacher_ids=absent_teacher_ids,
                                assigned_in_period=assigned_in_this_period,
                                activity_name=act,
                            )
                            if is_elig and a_score > best_act_score:
                                best_act_score = a_score
                                best_act_candidate = cand
                                best_act_breakdown = a_bk
                                best_act_name = act

                    if best_act_candidate and best_act_score > -math.inf:
                        assigned_sub_id = best_act_candidate.id
                        assigned_in_this_period.add(assigned_sub_id)
                        best_act_candidate.daily_substitution_count += 1
                        period_results[r.id] = {
                            "substitute_teacher_id": assigned_sub_id,
                            "status": "activity_fallback",
                            "is_activity_fallback": True,
                            "activity_name": best_act_name,
                            "suitability_score": best_act_score,
                            "score_breakdown": best_act_breakdown,
                        }
                    else:
                        period_results[r.id] = {
                            "substitute_teacher_id": None,
                            "status": "unassigned",
                            "is_activity_fallback": False,
                            "activity_name": None,
                            "suitability_score": 0.0,
                            "score_breakdown": {"reason": "No available academic or activity substitute found for this period"},
                        }
                else:
                    if assigned_sub_id:
                        assigned_in_this_period.add(assigned_sub_id)
                        candidates[assigned_sub_id].daily_substitution_count += 1

            # Build all alternatives list for each requirement so admin can view/override
            for r in p_reqs:
                alloc = period_results[r.id]
                sub_id = alloc.get("substitute_teacher_id")
                sub_cand = candidates.get(sub_id) if sub_id else None

                # Compute ranked alternatives for transparency
                alternatives = []
                for cid, cand in candidates.items():
                    if cid == sub_id or cid in absent_teacher_ids or cid == r.original_teacher_id:
                        continue
                    is_el, sc, bk, reason = self.evaluate_academic_candidate(
                        candidate=cand,
                        req=r,
                        absent_teacher_ids=absent_teacher_ids,
                        assigned_in_period=set(),
                    )
                    alternatives.append({
                        "teacher_id": cand.id,
                        "name": cand.name,
                        "category": cand.category,
                        "eligible": is_el,
                        "score": sc if is_el else None,
                        "breakdown": bk,
                        "reason": reason,
                    })

                alternatives.sort(key=lambda x: (x["eligible"], x["score"] or -999), reverse=True)

                # Save or update in database
                existing_rec = self.db.query(SubstitutionRecord).filter(
                    SubstitutionRecord.date == date_str,
                    SubstitutionRecord.timetable_id == r.timetable_id
                ).first()

                if existing_rec:
                    # Do not overwrite if admin manually overridden unless forced
                    if existing_rec.status != "manual_override":
                        existing_rec.period_name = r.period_name
                        existing_rec.start_time = r.start_time
                        existing_rec.end_time = r.end_time
                        existing_rec.class_ = r.class_
                        existing_rec.section = r.section
                        existing_rec.subject = r.subject
                        existing_rec.room = r.room
                        existing_rec.original_teacher_id = r.original_teacher_id
                        existing_rec.substitute_teacher_id = sub_id
                        existing_rec.status = alloc["status"]
                        existing_rec.is_activity_fallback = alloc["is_activity_fallback"]
                        existing_rec.activity_name = alloc["activity_name"]
                        existing_rec.suitability_score = alloc["suitability_score"]
                        existing_rec.score_breakdown = json.dumps(alloc["score_breakdown"])
                        existing_rec.updated_at = datetime.utcnow()
                        self.db.add(existing_rec)
                    db_rec_id = existing_rec.id
                else:
                    new_rec = SubstitutionRecord(
                        id=r.id,
                        date=date_str,
                        absence_id=r.absence_id,
                        timetable_id=r.timetable_id,
                        period_name=r.period_name,
                        start_time=r.start_time,
                        end_time=r.end_time,
                        class_=r.class_,
                        section=r.section,
                        subject=r.subject,
                        room=r.room,
                        original_teacher_id=r.original_teacher_id,
                        substitute_teacher_id=sub_id,
                        status=alloc["status"],
                        is_activity_fallback=alloc["is_activity_fallback"],
                        activity_name=alloc["activity_name"],
                        suitability_score=alloc["suitability_score"],
                        score_breakdown=json.dumps(alloc["score_breakdown"]),
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    self.db.add(new_rec)
                    db_rec_id = new_rec.id

                final_allocations.append({
                    "id": db_rec_id,
                    "date": date_str,
                    "period_name": r.period_name,
                    "start_time": r.start_time,
                    "end_time": r.end_time,
                    "class": r.class_,
                    "section": r.section,
                    "subject": r.subject,
                    "room": r.room,
                    "original_teacher": {
                        "id": r.original_teacher_id,
                        "name": r.original_teacher_name,
                    },
                    "substitute_teacher": {
                        "id": sub_cand.id,
                        "name": sub_cand.name,
                        "email": sub_cand.email,
                        "image": sub_cand.image,
                        "category": sub_cand.category,
                    } if sub_cand else None,
                    "status": alloc["status"],
                    "is_activity_fallback": alloc["is_activity_fallback"],
                    "activity_name": alloc["activity_name"],
                    "suitability_score": alloc["suitability_score"],
                    "score_breakdown": alloc["score_breakdown"],
                    "alternatives": alternatives[:6],  # top alternative candidates
                })

        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

        return final_allocations
