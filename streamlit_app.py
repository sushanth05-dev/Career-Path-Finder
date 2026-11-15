import json
import os
import pandas as pd
import streamlit as st
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class SkillGapItem(BaseModel):
    skill: str
    category: str
    current_status: str = Field(description="Have, Partial, or To Learn")
    current_level: str
    target_requirement: str
    priority: str = Field(description="Critical, High, or Recommended")
    estimated_hours: int


class RoadmapWeek(BaseModel):
    week: int
    title: str
    focus_area: str
    hours_allocated: int
    objectives: list[str]
    topics: list[str]
    milestone: str


class MiniProject(BaseModel):
    title: str
    difficulty: str
    estimated_hours: int
    recommended_week: str
    summary: str
    skills_applied: list[str]
    deliverables: list[str]


class CareerRoadmap(BaseModel):
    target_role: str
    hours_per_week: int
    role_summary: str
    readiness_summary: str
    skill_gap_table: list[SkillGapItem]
    roadmap_weeks: list[RoadmapWeek]
    mini_projects: list[MiniProject]


st.set_page_config(
    page_title="CareerPath — AI Career Roadmap & Skill Gap Finder",
    layout="wide",
)

st.title("CareerPath — AI Career Roadmap & Skill Gap Finder")
st.caption("Compare your current skills against a target role to generate a structured 8-week learning plan.")

with st.sidebar:
    st.header("Student Profile")
    skills_input = st.text_area(
        "Current Skills (comma-separated)",
        value="C, Basic Python, HTML",
        height=90,
    )
    target_role = st.text_input("Target Job Role", value="Data Scientist")
    hours_per_week = st.slider("Study Hours per Week", min_value=2, max_value=40, value=10)
    experience_level = st.selectbox("Experience Level", ["Beginner", "Intermediate", "Advanced"])
    generate_btn = st.button("Generate Roadmap", type="primary", use_container_width=True)

if generate_btn:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        st.error("GEMINI_API_KEY environment variable is not set.")
        st.stop()

    client = genai.Client(api_key=api_key)
    prompt = f"""
    Student Profile:
    - Current Skills: {skills_input}
    - Target Job Role: {target_role}
    - Weekly Study Availability: {hours_per_week} hours/week
    - Experience Level: {experience_level}

    Generate:
    1. A Skill Gap Table (8-12 skills) marking each skill as Have, Partial, or To Learn.
    2. An exact 8-week progressive roadmap scaled to {hours_per_week} hours/week.
    3. Exactly 3 portfolio-ready mini projects (Starter, Intermediate, Capstone).
    """

    with st.spinner("Analyzing skill gaps and building your 8-week plan..."):
        response = client.models.generate_content(
            model="gemini-4-hydrogen",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an expert technical career mentor. Provide crisp, realistic, "
                    "industry-aligned skill comparisons, weekly plans, and portfolio projects."
                ),
                response_mime_type="application/json",
                response_schema=CareerRoadmap,
            ),
        )

    roadmap = CareerRoadmap.model_validate_json(response.text)

    st.subheader(f"Target Role: {roadmap.target_role}")
    st.write(roadmap.role_summary)
    st.info(roadmap.readiness_summary)

    tab_gap, tab_weeks, tab_projects = st.tabs(
        ["Skill Gap Matrix", "8-Week Roadmap", "Portfolio Mini Projects"]
    )

    with tab_gap:
        df = pd.DataFrame([item.model_dump() for item in roadmap.skill_gap_table])
        st.dataframe(df, use_container_width=True, hide_index=True)

    with tab_weeks:
        for week in roadmap.roadmap_weeks:
            with st.expander(f"Week {week.week}: {week.title} ({week.hours_allocated} hrs)", expanded=week.week <= 2):
                st.write(f"**Focus Area:** {week.focus_area}")
                st.write("**Objectives:**")
                for obj in week.objectives:
                    st.write(f"- {obj}")
                st.write(f"**Topics:** {', '.join(week.topics)}")
                st.write(f"**Milestone:** {week.milestone}")

    with tab_projects:
        cols = st.columns(3)
        for col, project in zip(cols, roadmap.mini_projects):
            with col:
                st.markdown(f"### {project.title}")
                st.caption(f"{project.difficulty} · {project.estimated_hours} hrs · {project.recommended_week}")
                st.write(project.summary)
                st.write("**Deliverables:**")
                for d in project.deliverables:
                    st.write(f"- {d}")
