# Enhanced Anti-Cheat System for SaveRaks

## Overview

This multi-layer anti-cheat system is designed to detect and prevent duplicate image submissions and suspicious behavior in the SaveRaks trash collection web application. The system uses advanced image analysis, behavioral tracking, and real-time monitoring to ensure fair gameplay while minimizing false positives.

## Architecture

### Layer 1: Client-Side Validation
- Device fingerprinting using browser headers and user agent
- Image quality assessment before upload
- Submission cooldown enforcement

### Layer 2: Server-Side Image Analysis
- **Multiple Hashing Algorithms**:
  - pHash (Perceptual Hash) - frequency domain analysis
  - dHash (Difference Hash) - gradient-based comparison  
  - aHash (Average Hash) - intensity-based comparison
- **Color Histogram Analysis** - normalized RGB histogram correlation
- **Image Quality Assessment** - sharpness, contrast, resolution analysis
- **Metadata Extraction** - EXIF data and image properties

### Layer 3: Behavioral Analysis
- Submission frequency monitoring
- Device tracking across multiple accounts
- Historical flag rate analysis
- Time-based pattern detection

### Layer 4: Database & Storage
- Optimized similarity indexing with database indexes
- Redis caching for recent submissions (planned)
- Vector similarity search capabilities (future enhancement)

### Layer 5: Monitoring & Alerting
- Real-time dashboard for administrators
- Automated alert system for suspicious patterns
- Review workflow for flagged submissions

## Key Features

### 1. Multi-Algorithm Image Similarity
The system combines three different hashing algorithms to achieve high accuracy:

```typescript
// Combined similarity scoring
const similarity = await EnhancedAntiCheatService.calculateSimilarity(
    fingerprint, 
    candidate, 
    userId
);
```

- **pHash**: Detects structural similarities using DCT (Discrete Cosine Transform)
- **dHash**: Identifies gradient differences between adjacent pixels
- **aHash**: Compares average intensity levels
- **Histogram Correlation**: Confirms color similarity (0.85+ correlation required)

### 2. Configurable Thresholds
```typescript
private static readonly PHASH_STRICT_THRESHOLD = 5;  // Same user
private static readonly PHASH_GLOBAL_THRESHOLD = 8;   // Different users
private static readonly HISTOGRAM_CORRELATION_MIN = 0.85;
private static readonly QUALITY_MIN = 0.3;
```

### 3. Rate Limiting & Cooldowns
- **5-minute cooldown** between submissions per user
- **10 submissions per hour** maximum
- **Device-based tracking** to prevent multiple account abuse

### 4. Smart Decision Making
- **High confidence (90%+)**: Auto-reject submissions
- **Medium confidence (70-89%)**: Flag for manual review
- **Low confidence (<70%)**: Allow but monitor

## Database Schema

### Enhanced EcoAction Model
```sql
-- New fields added to eco_actions table
ALTER TABLE eco_actions ADD COLUMN d_hash VARCHAR(16);
ALTER TABLE eco_actions ADD COLUMN a_hash VARCHAR(16);
ALTER TABLE eco_actions ADD COLUMN device_fingerprint VARCHAR(16);
ALTER TABLE eco_actions ADD COLUMN image_quality DECIMAL(3,2);
ALTER TABLE eco_actions ADD COLUMN ip_address INET;
ALTER TABLE eco_actions ADD COLUMN user_agent TEXT;

-- Indexes for performance
CREATE INDEX idx_eco_actions_d_hash ON eco_actions(d_hash);
CREATE INDEX idx_eco_actions_a_hash ON eco_actions(a_hash);
CREATE INDEX idx_eco_actions_device_fingerprint ON eco_actions(device_fingerprint);
```

## API Endpoints

### Anti-Cheat Management
- `GET /api/anticheat/stats` - Admin statistics dashboard
- `GET /api/anticheat/user-status` - User's anti-cheat status
- `GET /api/anticheat/flagged` - List flagged submissions (admin)
- `PATCH /api/anticheat/:actionId/review` - Review flagged submission (admin)
- `POST /api/anticheat/test` - Test anti-cheat system (development)

### Enhanced Action Submission
The main submission endpoint `/api/actions` now includes:
- Multi-hash computation
- Device fingerprinting
- Quality assessment
- Behavioral analysis
- Smart rejection/approval logic

## Configuration

### Environment Variables
```env
NODE_ENV=production
ANTICHEAT_ENABLED=true
ANTICHEAT_LOG_LEVEL=info
```

### Runtime Configuration
```typescript
// Update thresholds via API
AntiCheatMonitor.updateConfig({
    flagRateThreshold: 15,
    hourlySubmissionThreshold: 20,
    deviceSuspicionThreshold: 10,
    qualityThreshold: 0.2
});
```

## Monitoring & Alerting

### Real-time Statistics
```typescript
const stats = await AntiCheatMonitor.getRealTimeStats();
// Returns: overall health, flag rates, active devices, etc.
```

### Automated Monitoring
```typescript
// Run hourly monitoring
const alerts = await AntiCheatMonitor.runMonitoring();
// Automatically detects:
// - High flag rates
// - Suspicious device activity  
// - Frequent submissions
// - Low image quality trends
```

### Alert Types
- **HIGH_FLAG_RATE**: Overall flag rate exceeds threshold
- **SUSPICIOUS_DEVICE**: Single device with many submissions
- **LOW_QUALITY**: Average image quality drops below threshold
- **FREQUENT_SUBMISSIONS**: User exceeds hourly limits

## Performance Considerations

### Database Optimization
- Indexes on all hash fields for fast lookups
- Limited query results (last 200 submissions) to manage memory
- Efficient candidate selection for similarity checks

### Memory Management
- Image processing streams to avoid loading full images
- Histogram normalization to reduce memory footprint
- Batch processing for multiple submissions

### Scalability
- Horizontal scaling possible with Redis caching
- Vector database integration planned for large-scale deployments
- Microservice architecture support

## False Positive Mitigation

### Multi-Algorithm Confirmation
- Requires agreement between multiple hash algorithms
- Color histogram correlation prevents false matches
- Quality assessment reduces edge cases

### User-Friendly Approach
- Low confidence submissions are allowed but monitored
- Clear feedback for rejected submissions
- Appeal process for false flags

### Adaptive Thresholds
- Different thresholds for same user vs different users
- Quality-based confidence adjustment
- Historical behavior consideration

## Security Considerations

### Client-Side Protection
- Device fingerprinting prevents simple device switching
- Rate limiting at multiple levels
- Request validation and sanitization

### Server-Side Security
- All image processing server-side
- No trust in client-provided hashes
- IP-based tracking and geolocation analysis

### Data Privacy
- Device fingerprints are hashed and truncated
- IP addresses stored for security analysis only
- User data anonymized in monitoring reports

## Deployment Guide

### 1. Database Migration
```bash
cd backend
npm run prisma:migrate
```

### 2. Environment Setup
```bash
# Enable anti-cheat in production
export NODE_ENV=production
export ANTICHEAT_ENABLED=true
```

### 3. Monitoring Setup
```bash
# Set up cron job for hourly monitoring
0 * * * * curl -X POST http://localhost:3000/api/anticheat/monitor
```

### 4. Testing
```bash
# Test the system with sample images
curl -X POST http://localhost:3000/api/anticheat/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "data:image/jpeg;base64,..."}'
```

## Future Enhancements

### Planned Features
1. **Vector Database Integration** - Pinecone/Weaviate for large-scale similarity search
2. **Machine Learning Models** - Custom CNN for image similarity
3. **Geospatial Analysis** - Location-based clustering detection
4. **Blockchain Verification** - Immutable submission records
5. **Advanced Behavioral Analytics** - ML-based pattern recognition

### Performance Improvements
1. **Redis Caching** - Recent submission cache
2. **CDN Integration** - Distributed image processing
3. **Background Processing** - Queue-based similarity checks
4. **GPU Acceleration** - CUDA-based hash computation

## Troubleshooting

### Common Issues

1. **High False Positive Rate**
   - Adjust thresholds in configuration
   - Check image quality assessment
   - Review histogram correlation settings

2. **Performance Issues**
   - Monitor database query performance
   - Check memory usage during image processing
   - Consider reducing candidate pool size

3. **Missing Hashes in Database**
   - Run database migration
   - Regenerate Prisma client
   - Check field names in schema

### Debug Mode
```typescript
// Enable detailed logging
process.env.ANTICHEAT_LOG_LEVEL = 'debug';

// Test with known duplicate images
const testResult = await EnhancedAntiCheatService.checkDuplicate(
    fingerprint, 
    userId, 
    deviceFingerprint
);
```

## Support & Maintenance

### Regular Tasks
- Monitor flag rates and adjust thresholds
- Review flagged submissions daily
- Update algorithm parameters based on usage patterns
- Backup anti-cheat configuration and data

### Emergency Procedures
- Immediate system disable if high false positive rate
- Manual review queue processing
- User communication for system issues
- Rollback procedures for configuration changes

---

This anti-cheat system provides comprehensive protection against duplicate submissions while maintaining a fair user experience. The multi-layer approach ensures both accuracy and scalability for thousands of users.
