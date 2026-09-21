"""Face detection for the wedding-party photo pipeline (scripts/optimize-party-photos.mjs).

One-off helper — not part of the build. Prints, for every photo in
assets-source/wedding-party/, the face found by OpenCV's YuNet detector (box
centre and width, in source pixels), so a crop can be centred on the face instead
of the middle of the frame. Paste the results into scripts/wedding-party-faces.json.

    python -m venv .venv && .venv/Scripts/pip install "opencv-python-headless<5"
    .venv/Scripts/python scripts/detect-faces.py [name ...]

The ~230 KB YuNet model is downloaded once into assets-source/ (gitignored).
Transparent PNG cut-outs are flattened onto mid-grey first.
"""
import os
import sys
import urllib.request

import cv2
import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "assets-source", "wedding-party")
MODEL = os.path.join(ROOT, "assets-source", "face_detection_yunet_2023mar.onnx")
MODEL_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

if not os.path.exists(MODEL):
    urllib.request.urlretrieve(MODEL_URL, MODEL)


def load(path):
    im = cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if im.ndim == 3 and im.shape[2] == 4:
        a = im[:, :, 3:4].astype(float) / 255
        im = (im[:, :, :3] * a + 128 * (1 - a)).astype(np.uint8)
    return im


for name in sorted(os.listdir(SRC)):
    stem, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg", ".png") or (len(sys.argv) > 1 and stem not in sys.argv[1:]):
        continue
    image = load(os.path.join(SRC, name))
    h, w = image.shape[:2]
    detector = cv2.FaceDetectorYN.create(MODEL, "", (w, h), 0.6, 0.3, 5000)
    _, faces = detector.detect(image)
    if faces is None:
        print(f"# {stem}: no face found")
        continue
    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])[:4]
    print(f'"{stem}": {{ "cx": {int(x + fw / 2)}, "cy": {int(y + fh / 2)}, "face": {int(fw)} }},')
