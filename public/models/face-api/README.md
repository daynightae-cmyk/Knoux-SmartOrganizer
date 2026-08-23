# Face-API Models

This directory contains the face detection models for the Knoux SmartOrganizer.

## Required Files

To enable face detection features, download the following files from the face-api.js repository:

1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1.bin`
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1.bin`
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1.bin`
7. `face_expression_model-weights_manifest.json`
8. `face_expression_model-shard1.bin`
9. `age_gender_model-weights_manifest.json`
10. `age_gender_model-shard1.bin`

## Download Instructions

1. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
2. Download all the `.json` and `.bin` files
3. Place them in this directory (`public/models/face-api/`)

The application will automatically detect and load these models when they're available.
