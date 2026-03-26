# AI-GV-25-26

This repository showcases an integration of **FastAPI** and **Vite React** for building modern web applications.

## FastAPI
FastAPI is a modern web framework for building APIs with Python 3.6+ based on standard Python type hints.

### Features:
- Fast: Very high performance, on par with NodeJS and Go (thanks to Starlette and Pydantic).
- Easy: Designed to be easy to use and learn. Less time debugging.
- Short: Minimize code duplication. Multiple features from each parameter declaration.
- Robust: Get production-ready code. With automatic interactive documentation.

### Installation:
To install FastAPI, you can use pip:
```bash
pip install fastapi
```

### Example FastAPI Application:
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}
```

## Vite React
Vite is a new breed of build tool that significantly improves the frontend development experience.

### Features:
- Blazing Fast: Instant server start and super-fast Hot Module Replacement (HMR).
- Rich Features: Out of the box support for TypeScript, JSX, and more.
- Optimized Build: Leverages Rollup for production builds.

### Installation:
To install Vite, you can run:
```bash
npm create vite@latest
```

### Example Vite React Application:
```javascript
import React from 'react';
import ReactDOM from 'react-dom';

function App() {
    return <h1>Hello Vite + React!</h1>;
}

ReactDOM.render(<App />, document.getElementById('root'));
```

## Contributing
Feel free to contribute to this repository by opening issues or pull requests.
