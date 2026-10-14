# 🦌 FaunaDecode AI
> **Edge-Native Multimodal Bioacoustic & Keypoint Kinematics Framework for Real-Time Wildlife Threat Decoding**

![Round](https://img.shields.io/badge/Hackathon-Code_Yudh_Round_2-10B981?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live_Prototype-2563EB?style=for-the-badge)
![Offline](https://img.shields.io/badge/Architecture-100%25_Offline-EF4444?style=for-the-badge)

## 📌 The Wilderness Blindspot
Over 85% of wilderness reserves operate in total cellular dead zones. Standard conservation AI models fail completely off-grid. Furthermore, traditional camera traps are unimodal—they detect bounding boxes but cannot interpret muscular tension, gait trauma, or vocal distress calls. FaunaDecode AI bridges this gap.

**FaunaDecode AI** is a 100% offline-first, dual-stream multimodal edge intelligence framework. It correlates animal posture kinematics with bioacoustic spectral intent to detect wildlife threats (Calm, Stressed, Injured, Aggressive) in sub-100ms, broadcasting non-lethal early warnings over off-grid LoRaWAN/BLE mesh networks.

---

## 🚀 Round 2 Core Deployments
We have completely upgraded our pipeline for Round 2, moving from conceptual AI to a fully interactive, edge-deployable operations console:

- **100% Offline Edge Inference (ONNX Runtime Web):** Model execution runs directly on the edge/client using ONNX, eliminating cloud API dependencies.
- **Multi-Vector Parametric Triage:** A sub-5ms in-memory filtering engine (`useMemo`) allowing rangers to query incidents by Category, Severity, Sector, and Date without page reloads.
- **Forensic Evidence Pipeline:** High-resolution field photos, WAV audio clips, and 2D Mel-spectrogram images are bound directly to local `SQLite` incident records with an interactive inspection modal.
- **Automated Hotspot Analytics:** Algorithmic calculation of incident density across spatial reserve boundaries to dynamically highlight perimeter threats.

---

## 🧠 Dual-Stream Multimodal Architecture
Instead of relying on single sensors, our system executes parallel neural networks and merges them via a confidence-weighted late-fusion engine: `S_unified = α · f(P_V) + (1 - α) · g(P_A)`

1. **Visual Kinematics (Vision):** Quantized **INT8 YOLOv8-pose** extracts an 18–24 skeletal keypoint matrix. Evaluates gait asymmetry and cranial-spinal angular deflection to flag physical injury and pre-charge stances.
2. **Bioacoustic Spectrograms (Audio):** Continuous 22,050 Hz audio is transformed via 1024-point STFT into 128-band Mel-spectrograms. A lightweight **MobileNetV3-Small** CNN classifies vocal intent (distress, alarm, territorial).

---

## 🛠️ Proposed Tech Stack

### Frontend & Triage Dashboard
* **React.js** & **Tailwind CSS** (Reactive UI & command console)
* **ONNX Runtime Web** (In-browser, zero-latency model execution)
* **Turf.js** (Geofence perimeter calculations)

### Backend & Local Storage
* **Python FastAPI** (Microservices architecture)
* **OpenCV** (Video frame ingestion & downsampling)
* **SQLite** (Offline-first embedded persistence & evidence logging)

### AI / ML Core
* **YOLOv8-pose** (INT8 quantized skeletal kinematics)
* **MobileNetV3** (Acoustic CNN classifier)
* **librosa** (STFT & Mel-spectrogram generation)

### Telemetry & Connections
* **LoRaWAN (868/915 MHz) / BLE Mesh** (Off-grid packet broadcast)

---

## 🛡️ Ethical Guardrails & Governance
Conservation technology must be secure by design. FaunaDecode AI enforces strict, hard-coded guardrails:
* **Anti-Poaching Obfuscation:** 10 km spatial coordinate fuzzing protects endangered species from malicious tracking.
* **Biometric Exclusion:** Zero human facial recognition; perimeter human presence is tracked strictly as anonymous motion bounding vectors.
* **Non-Lethal Defense:** Strict software isolation rejecting automated kinetic, electric, or lethal deterrent payloads.
* **Human-in-the-Loop:** Mandatory ranger verification of forensic evidence prior to field dispatch.

---

## 💻 Local Setup & Installation (For Judges)

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### 1. Clone the Repository
```bash
git clone [https://github.com/Aditya27272727/Faunacode.git](https://github.com/Aditya27272727/Faunacode.git)
cd Faunacode
