from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional

class Education(BaseModel):
    degree: str
    institution: str
    year: str
    cgpa: str

class Skills(BaseModel):
    languages: List[str]
    backend_and_databases: List[str]
    authentication_and_security: List[str]
    embedded_and_iot:List[str]
    developer_tools:List[str]

class Projects(BaseModel):
    name: str
    description: str
    tech_stack: List[str]
    github_link: Optional[HttpUrl] = None

class CandidateProfile(BaseModel):
    name: str
    title: str
    email: EmailStr
    phone: str
    location: str
    linkedin: HttpUrl
    github: HttpUrl
    education: List[Education]
    skills: Skills
    projects: List[Projects]
    experience: List[dict] = []
    achievements: List[str] = []
    certifications: List[dict] = []