# MobileNet Classification Model

This directory is for the image classification model.

## Model Information

The application uses TensorFlow.js models for image classification. If you have a custom MobileNet model, place the following files here:

- `model.json` - Model architecture
- `group1-shard1of1.bin` - Model weights

## Fallback

If no model is provided, the application will use a simplified rule-based classification system based on color analysis and basic image properties.
