from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from slugify import slugify
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24 * 7
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------- Models ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class PostBase(BaseModel):
    title: str
    excerpt: str = ""
    content: str = ""
    tags: List[str] = Field(default_factory=list)
    published: bool = True


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    published: Optional[bool] = None


class Post(PostBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    tldr: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class SiteConfig(BaseModel):
    handle: str = "n0ct"
    tagline: str = "IT engineer breaking things to learn how they work."
    bio: str = (
        "Journal of an ongoing journey through IT, cybersecurity, and the "
        "small tricks I pick up along the way. Notes-to-self, disguised as blog posts."
    )


# ---------- Auth helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(cred: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if not cred:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"username": username, "role": "admin"}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Slug helper ----------
async def make_unique_slug(title: str, existing_id: Optional[str] = None) -> str:
    base = slugify(title) or "post"
    slug = base
    i = 2
    while True:
        q = {"slug": slug}
        if existing_id:
            q["id"] = {"$ne": existing_id}
        exists = await db.posts.find_one(q, {"_id": 0, "id": 1})
        if not exists:
            return slug
        slug = f"{base}-{i}"
        i += 1


# ---------- Startup: seed ----------
@app.on_event("startup")
async def seed():
    # Admin user
    admin = await db.users.find_one({"username": "admin"}, {"_id": 0})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_pw("admin123"),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user (admin / admin123)")

    # Site config
    cfg = await db.site_config.find_one({"_id": "site"})
    if not cfg:
        default = SiteConfig().model_dump()
        default["_id"] = "site"
        await db.site_config.insert_one(default)

    # Seed 3 sample posts if empty
    count = await db.posts.count_documents({})
    if count == 0:
        samples = [
            {
                "title": "Booting Up: Why I Started This Blog",
                "excerpt": "First entry in the log. A little about who I am, what I break, and what I'm here to share.",
                "tags": ["journey", "meta"],
                "content": (
                    "## whoami\n\n"
                    "I'm just another engineer with a stubborn curiosity for how things work — "
                    "and, more interestingly, how they fail.\n\n"
                    "This blog is my `~/.bash_history` made public: half journal, half cheatsheet, "
                    "half war-story. Yes, that's three halves. That's the point.\n\n"
                    "## What you'll find here\n\n"
                    "- **CTF writeups** — walkthroughs of boxes and challenges I've solved.\n"
                    "- **IT notes** — the fiddly, undocumented stuff that never made it into the manual.\n"
                    "- **Threat model rambles** — thinking out loud about attacks and defenses.\n\n"
                    "```bash\n$ echo 'welcome, stranger' | figlet\n```\n\n"
                    "Stick around. It's going to get weird."
                ),
            },
            {
                "title": "Nmap Cheatsheet I Keep Forgetting",
                "excerpt": "The scans I reach for in the first 10 minutes of any engagement, and the flags that actually matter.",
                "tags": ["cybersecurity", "nmap", "recon"],
                "content": (
                    "Every time I open a terminal to scan a host, my brain empties. "
                    "So here it lives, on the internet, where I can find it faster than in my notes app.\n\n"
                    "## Quick host discovery\n\n"
                    "```bash\nnmap -sn 10.10.10.0/24\n```\n\n"
                    "## Full TCP + version + scripts\n\n"
                    "```bash\nnmap -sC -sV -oA scans/full -p- --min-rate 2000 10.10.10.5\n```\n\n"
                    "## UDP (slow, but necessary)\n\n"
                    "```bash\nnmap -sU --top-ports 50 10.10.10.5\n```\n\n"
                    "The `--min-rate` flag is a lifesaver on wide scans — just don't melt the target."
                ),
            },
            {
                "title": "Setting Up a Homelab on a Budget",
                "excerpt": "Refurbished thin clients, Proxmox, and a very patient wife. Here's the setup.",
                "tags": ["it", "homelab", "journey"],
                "content": (
                    "You do not need a rack. You do not need 128GB of RAM. "
                    "You need one refurbished thin client from eBay and about $80.\n\n"
                    "## Hardware\n\n"
                    "- HP T620 Plus (Quad-core, 8GB RAM) — around $60\n"
                    "- 256GB SATA SSD — $25\n"
                    "- A USB stick for the Proxmox installer\n\n"
                    "## Software\n\n"
                    "1. Flash Proxmox VE onto the USB\n"
                    "2. Boot, install, laugh at how quiet the fans are\n"
                    "3. Spin up VMs for `pfSense`, a vulnerable lab, and one Kali box\n\n"
                    "> The best homelab is the one that's actually running.\n\n"
                    "More posts to follow on wiring up the lab network."
                ),
            },
        ]
        for s in samples:
            slug = await make_unique_slug(s["title"])
            doc = Post(**s, slug=slug).model_dump()
            await db.posts.insert_one(doc)
        logger.info(f"Seeded {len(samples)} sample posts")


# ---------- Public routes ----------
@api_router.get("/")
async def root():
    return {"message": "kernel: system online"}


@api_router.get("/site")
async def get_site():
    cfg = await db.site_config.find_one({"_id": "site"}, {"_id": 0})
    return cfg or SiteConfig().model_dump()


@api_router.get("/posts")
async def list_posts(q: Optional[str] = None, tag: Optional[str] = None, include_unpublished: bool = False):
    query = {}
    if not include_unpublished:
        query["published"] = True
    if tag:
        query["tags"] = tag
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"excerpt": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.get("/posts/tags")
async def all_tags():
    tags = await db.posts.distinct("tags", {"published": True})
    return sorted(tags)


@api_router.get("/posts/{slug}")
async def get_post(slug: str):
    doc = await db.posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post not found")
    return doc


# ---------- Auth routes ----------
@api_router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    user = await db.users.find_one({"username": body.username}, {"_id": 0})
    if not user or not verify_pw(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["username"])
    return TokenOut(access_token=token, username=user["username"])


@api_router.get("/auth/me")
async def me(user: str = Depends(get_current_admin)):
    return {"username": user, "role": "admin"}


# ---------- Admin post routes ----------
@api_router.get("/admin/posts")
async def admin_list(user: str = Depends(get_current_admin)):
    docs = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/admin/posts")
async def create_post(body: PostCreate, user: str = Depends(get_current_admin)):
    slug = await make_unique_slug(body.title)
    post = Post(**body.model_dump(), slug=slug)
    await db.posts.insert_one(post.model_dump())
    return post.model_dump()


@api_router.put("/admin/posts/{post_id}")
async def update_post(post_id: str, body: PostUpdate, user: str = Depends(get_current_admin)):
    existing = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Post not found")
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if "title" in updates and updates["title"] != existing["title"]:
        updates["slug"] = await make_unique_slug(updates["title"], existing_id=post_id)
    if "content" in updates:
        updates["tldr"] = None  # invalidate old summary
    updates["updated_at"] = now_iso()
    await db.posts.update_one({"id": post_id}, {"$set": updates})
    doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: str, user: str = Depends(get_current_admin)):
    res = await db.posts.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Post not found")
    return {"deleted": post_id}


@api_router.put("/admin/site")
async def update_site(body: SiteConfig, user: str = Depends(get_current_admin)):
    data = body.model_dump()
    data["_id"] = "site"
    await db.site_config.replace_one({"_id": "site"}, data, upsert=True)
    return {k: v for k, v in data.items() if k != "_id"}


# ---------- AI TL;DR ----------
@api_router.post("/posts/{post_id}/tldr")
async def generate_tldr(post_id: str):
    """Public endpoint: reveals/generates the AI TL;DR for a post.
    Caches the result on the post document so subsequent calls are free."""
    doc = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Post not found")
    if doc.get("tldr"):
        return {"tldr": doc["tldr"], "cached": True}

    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key not configured")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"tldr-{post_id}",
        system_message=(
            "You write TL;DR summaries for a personal cybersecurity/IT blog. "
            "Given a blog post's title and markdown content, respond with a single "
            "concise summary of 1-2 sentences (max ~40 words). "
            "No preamble, no 'TL;DR:' prefix, no markdown formatting — just the summary sentence."
        ),
    ).with_model("anthropic", "claude-sonnet-5")

    prompt = f"Title: {doc['title']}\n\nContent:\n{doc['content'][:4000]}"
    try:
        response = await chat.send_message(UserMessage(text=prompt))
        summary = (response or "").strip().strip('"').strip()
    except Exception as e:
        logger.exception("TLDR generation failed")
        raise HTTPException(500, f"TLDR generation failed: {e}")

    await db.posts.update_one({"id": post_id}, {"$set": {"tldr": summary}})
    return {"tldr": summary, "cached": False}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
