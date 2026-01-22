
import { api } from './api';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/...;base64, prefix
            // But usually we might want to keep it or remove it depending on backend.
            // Backend cleanBase64 handles existing commas.
            resolve(result);
        };
        reader.onerror = reject;
    });
};

export const analyzeEnvironmentImage = async (base64Image: string, mode: string) => {
    // We delegate the analysis to the backend API which now handles Gemini comfortably
    // The 'mode' is ignored for now as the backend handles general waste analysis
    const response = await api.analyzeImage(base64Image);
    return response.wasteSorting; // Extract the inner data object
};
