# MongoDB Portfolio Database Schema

## Collection: workexperiences

### Schema Structure

```typescript
interface Workexperiences {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  companyName: string;
  position: string;
  startDate: Date;
  endDate: Date;
  isPresent: boolean;
  description: string;
  companyLogo: {
    relativePath: string;
    original: string;
    thumbnail: string;
  }
  createdAt: Date;
  updatedAt: Date;
  website: string;
}
```

### Sample Document

```json
{
  "_id": "67ae770ceecb7f00d49847b9",
  "companyName": "Harness.io",
  "position": "Developer Relations Engineer (Technical Product Manager)",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-08-05T00:00:00.000Z",
  "isPresent": false,
  "description": "<u>**Automation & Efficiency**</u>: Streamlined developer workflows by leveraging AI-powered platforms, enabling faster iterations and increased productivity.  \r\n<u>**Customer-Centric Decision Making**</u>: Analyzed Gong call feedback and system data to drive product improvements, enhancing user satisfaction and retention.  \r\n<u>**Product Quality & Execution**</u>: Strengthened software development tools by reviewing bug reports, automating processes, and crafting detailed documentation for seamless adoption.  \r\n<u>**User Growth & Engagement**</u>: Led market research and community-driven initiatives to refine developer tool workflows, driving increased user participation and product adoption.  ",
  "companyLogo": {
    "relativePath": "work-experiences/1739587070768-harness_1x1.png",
    "original": "https://portfoliostorage2024.blob.core.windows.net/originals/work-experiences/1739587070768-harness_1x1.png",
    "thumbnail": "https://portfoliostorage2024.blob.core.windows.net/thumbnails/work-experiences/1739587070768-harness_1x1.png"
  },
  "createdAt": "2025-02-13T22:49:48.887Z",
  "updatedAt": "2025-02-15T10:15:36.711Z",
  "website": "https://www.harness.io/"
}
```

Total documents in collection: 3

---

## Collection: logs

### Schema Structure

```typescript
interface Logs {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  timestamp: Date;
  level: string;
  category: string;
  message: string;
  details: {
    username: string;
  }
  userId: string;
  username: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  __v: number;
}
```

### Sample Document

```json
{
  "_id": "67a1cb99528c8026161a96b6",
  "timestamp": "2025-02-04T08:11:05.108Z",
  "level": "info",
  "category": "auth",
  "message": "Successful login",
  "details": {
    "username": "admin"
  },
  "userId": "67a1b8f0d16932be41927f61",
  "username": "admin",
  "ip": "::1",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "path": "/api/auth/signin",
  "method": "POST",
  "__v": 0
}
```

Total documents in collection: 223

---

## Collection: projects

### Schema Structure

```typescript
interface Projects {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  title: string;
  description: string;
  category: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  image: {
    original: string;
    thumbnail: string;
    _id: {
      buffer: object;
    }
  }
  link: string;
  tags: Array<string>;
  skills: Array<string>;
  createdBy: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
```

### Sample Document

```json
{
  "_id": "67ad60396913907d47e41ebf",
  "title": "new1new1new1new1new1new1new1new1new1new1new1new1ne",
  "description": "new1new1new1new1new1new1new1new1new1new1new1new1nenew1new1new1new1new1new1new1new1new1new1new1new1nenew1new1new1new1new1new1new1new1new1new1new1new1nenew1new1new1new1new1new1new1new1new1new1new1new1nenew1new1new1new1new1new1new1new1new1new1new1new1nenew1new1new1new1new1new1new1new1new1new1new1new1ne",
  "category": "67a2b31de0923549a3fb8b64",
  "image": {
    "original": "https://portfoliostorage2024.blob.core.windows.net/originals/project-1739415608693.jpg?sv=2025-01-05&spr=https&st=2025-02-13T03%3A00%3A09Z&se=2025-02-14T03%3A00%3A09Z&sr=b&sp=r&sig=Hw3xnadqxzIjpJ79aLzVs0ueMZ2CIRKvWnaXeD3mLow%3D",
    "thumbnail": "https://portfoliostorage2024.blob.core.windows.net/originals/project-1739415608693.jpg?sv=2025-01-05&spr=https&st=2025-02-13T03%3A00%3A09Z&se=2025-02-14T03%3A00%3A09Z&sr=b&sp=r&sig=Hw3xnadqxzIjpJ79aLzVs0ueMZ2CIRKvWnaXeD3mLow%3D",
    "_id": "67ad608c6913907d47e41ed5"
  },
  "link": "https://www.linkedin.com/feed/",
  "tags": [
    "new1",
    "asd",
    "asdasd",
    "asdf",
    "qwe"
  ],
  "skills": [
    "new11",
    "oruher",
    "qhtr",
    "sad",
    "yhr"
  ],
  "createdBy": "67a1b8f0d16932be41927f61",
  "createdAt": "2025-02-13T03:00:09.631Z",
  "updatedAt": "2025-02-13T03:01:32.290Z",
  "__v": 1
}
```

Total documents in collection: 3

---

## Collection: admins

### Schema Structure

```typescript
interface Admins {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  username: string;
  password: string;
  __v: number;
}
```

### Sample Document

```json
{
  "_id": "67a1b8f0d16932be41927f61",
  "username": "admin",
  "password": "$2a$10$8CNqumu0lHFOp/QmHJpSjetiHG3eU6pKdWd4TLBM.MC6EzlZv7IVW",
  "__v": 0
}
```

Total documents in collection: 1

---

## Collection: categories

### Schema Structure

```typescript
interface Categories {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  category: string;
  __v: number;
  color: string;
  createdAt: Date;
  description: string;
  enabled: boolean;
  title: string;
  updatedAt: Date;
  colorPalette: string;
}
```

### Sample Document

```json
{
  "_id": "67a2b31de0923549a3fb8b64",
  "category": "product",
  "__v": 0,
  "color": "#dd6464",
  "createdAt": "2025-02-05T00:38:53.039Z",
  "description": "Manage your product portfolio projects",
  "enabled": true,
  "title": "Product Projects",
  "updatedAt": "2025-02-12T07:54:47.868Z",
  "colorPalette": "forest-haven"
}
```

Total documents in collection: 4

---

## Collection: basic_info

### Schema Structure

```typescript
interface Basic_info {
  _id: {
    buffer: {
      0: number;
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
      6: number;
      7: number;
      8: number;
      9: number;
      10: number;
      11: number;
    }
  }
  email: string;
  name: string;
  phone: string;
  updatedAt: Date;
  yearsOfExperience: string;
  profilePicture: {
    relativePath: string;
    original: string;
    thumbnail: string;
  }
}
```

### Sample Document

```json
{
  "_id": "67a46812e0923549a3fc05e0",
  "email": "msaifee@andrew.cmu.edu",
  "name": "Mustafa Kuresh Saifee",
  "phone": "+1 650 439 6380",
  "updatedAt": "2025-02-15T02:38:11.717Z",
  "yearsOfExperience": "3+",
  "profilePicture": {
    "relativePath": "profile/profile-1739587091717-port prof pic.jpg",
    "original": "https://portfoliostorage2024.blob.core.windows.net/originals/profile/profile-1739587091717-port%20prof%20pic.jpg",
    "thumbnail": "https://portfoliostorage2024.blob.core.windows.net/thumbnails/profile/profile-1739587091717-port%20prof%20pic.jpg"
  }
}
```

Total documents in collection: 1

---
Never delete the below command, it is used to get the schema of the database.

```bash
npx ts-node scripts/inspect-schema.ts
```

or

```bash
npm run inspect-schema
```

