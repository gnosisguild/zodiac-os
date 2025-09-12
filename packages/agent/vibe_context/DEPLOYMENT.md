# Zodiac Agent - Deployment Guide

## Deployment Checklist

### Pre-Deployment Requirements

#### Required API Keys
- [ ] **Anthropic API Key** - For Claude AI assistant
- [ ] **Messari API Key** - For market data and analysis
- [ ] **DeBank Access Key** - For DeFi portfolio analysis

#### Environment Setup
- [ ] Copy `.env.example` to `.env.local` for development
- [ ] Fill in all required API keys
- [ ] Test locally with `npm run dev`
- [ ] Verify all features work (charts, portfolio analysis, market data)

## 📋 Vercel Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `agent-demo` project

2. **Configure Environment Variables**:
   Add these variables in Vercel dashboard:
   ```
   ANTHROPIC_API_KEY=your_anthropic_key_here
   MESSARI_API_KEY=your_messari_key_here
   DEBANK_ACCESS_KEY=your_debank_key_here
   NODE_ENV=production
   ```

3. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment at provided URL

### 3. Post-Deployment Verification

#### Test Core Features
- [ ] Chat interface loads correctly
- [ ] AI responses work (try: "Hello" or "What is Bitcoin?")
- [ ] Market analysis with charts (try: "Show me Ethereum's price chart")
- [ ] Portfolio analysis (try: "Analyze portfolio: 0x...")
- [ ] Sources and citations display properly
- [ ] Mobile responsiveness works
- [ ] Error handling displays user-friendly messages

#### Performance Check
- [ ] Page loads within 3 seconds
- [ ] Charts render smoothly
- [ ] No JavaScript errors in console
- [ ] All API endpoints respond correctly

## 🔧 Configuration Details

### Environment Variables Explained

| Variable | Purpose | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude AI assistant functionality | Yes |
| `MESSARI_API_KEY` | Market data and price charts | Yes |
| `DEBANK_ACCESS_KEY` | DeFi portfolio analysis | Yes |
| `NODE_ENV` | Environment type (production) | Yes |

### API Rate Limits (Unpaid Tiers)
- **Messari**: 2 requests per day
- **DeBank**: Check current limits in their documentation
- **Anthropic**: Based on your plan

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run type-check

# Verify all dependencies
npm install
```

#### API Connection Issues
- Verify API keys are correctly set in Vercel environment variables
- Check API key permissions and quotas
- Test API endpoints independently

#### Chart Display Problems
- Ensure Recharts and date-fns are properly installed
- Check for JavaScript errors in browser console
- Verify chart data structure matches expectations

#### Mobile Display Issues
- Test responsive design at different screen sizes
- Check CSS classes are properly applied
- Verify touch interactions work on mobile devices

## 📱 Feature Overview

### Core Capabilities
✅ **AI Chat Interface**: Natural language interaction with Claude
✅ **Market Analysis**: Real-time crypto insights via Messari AI Copilot
✅ **Interactive Charts**: Dynamic price charts with OHLCV data
✅ **Portfolio Analysis**: DeFi wallet analysis via DeBank API
✅ **Source Citations**: Clickable references for research transparency
✅ **Mobile Responsive**: Optimized for all device sizes
✅ **Error Handling**: User-friendly error messages
✅ **Loading States**: Clear feedback during processing

### Example Queries
- "Show me Bitcoin's price chart"
- "What's the latest on Ethereum?"
- "Analyze my DeFi portfolio: 0x742d35Cc6634C0532925a3b8D93C2d5AFD28aB03"
- "Compare Uniswap and SushiSwap"
- "What are the top DeFi protocols?"

## 🔒 Security Considerations

### API Key Security
- Never commit API keys to version control
- Use Vercel environment variables for production
- Regularly rotate API keys
- Monitor API usage for unusual activity

### Error Handling
- API errors don't expose internal details to users
- Proper input validation for wallet addresses
- Timeout handling prevents hanging requests
- Rate limiting protection built-in

## 📊 Monitoring & Maintenance

### Health Checks
- Monitor API response times
- Check error rates in Vercel analytics
- Verify chart data accuracy
- Test portfolio analysis with known addresses

### Updates
- Keep dependencies updated
- Monitor API changelog for breaking changes
- Test new features in staging environment
- Deploy during low-traffic periods

## 🎯 Success Metrics

### User Experience
- Page load time < 3 seconds
- Chart render time < 2 seconds
- Error rate < 5%
- Mobile usability score > 90%

### Feature Adoption
- Chart visualization usage
- Portfolio analysis queries
- Source citation clicks
- Error recovery rates

---

*Last updated: August 2025*
*Version: 1.0.0*