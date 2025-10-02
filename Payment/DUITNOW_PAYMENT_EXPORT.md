# DuitNow Payment Export Guide

## Overview
DuitNow is Malaysia's instant payment system that enables real-time transfers using recipient IC numbers, passport numbers, or mobile phone numbers. This guide covers the DuitNow export functionality in Baito AI.

## Key Features
- **Instant Transfer**: Funds are transferred immediately
- **ID-Based Transfer**: Uses IC/Passport/Mobile number instead of account numbers
- **Cost-Effective**: Lower fees compared to IBG/RENTAS for local transfers
- **24/7 Availability**: Operates round the clock including weekends and holidays

## Export Process

### Step 1: Access Payment Queue
1. Navigate to **Payments** page
2. Locate the payment batch you want to export
3. Click the dropdown menu (⋮) next to the batch
4. Select **"Export to ECP (Excel)"**

### Step 2: Configure Export Settings
1. **Transaction Type**: Select **"DuitNow - Instant Transfer (Recommended)"**
2. **Payment Date**: Select today or up to 60 days in advance
3. **Review Validations**: Check for any missing recipient IDs

### Step 3: Validation Checks
The system automatically validates:
- ✅ All recipients have IC/Passport numbers
- ✅ Passport numbers are properly formatted
- ✅ Payment amounts are within limits
- ✅ No duplicate transactions

### Step 4: Generate File
1. Click **"Generate ECP"** button
2. File will be downloaded as: `ECP-[BatchRef]-[DateTime]_DUITNOW.xlsx`
3. Save the file to a secure location

## Recipient ID Requirements

### Malaysian IC Numbers
- **Format**: 12-digit number (e.g., 901231145678)
- **No special characters**: Remove hyphens if present
- **Validation**: System checks for valid IC format

### Passport Numbers
- **Format**: Alphanumeric (e.g., A12345678)
- **Country Code**: 3-digit ISO code automatically appended
- **Examples**:
  - Malaysian passport: MYS
  - Singapore passport: SGP
  - Indonesian passport: IDN
  - Philippines passport: PHL
  - Bangladesh passport: BGD

### Mobile Numbers
- **Format**: Without country code (e.g., 0123456789)
- **Malaysian numbers only**: Must be registered with DuitNow

## Country Codes Reference

### Common Country Codes for Foreign Workers
| Country | Code | Example Passport |
|---------|------|------------------|
| Malaysia | MYS | A12345678MYS |
| Singapore | SGP | K98765432SGP |
| Indonesia | IDN | B87654321IDN |
| Philippines | PHL | P12345678PHL |
| Bangladesh | BGD | BG1234567BGD |
| Myanmar | MMR | MD1234567MMR |
| Nepal | NPL | 12345678NPL |
| India | IND | Z1234567IND |
| Pakistan | PAK | AB1234567PAK |
| Vietnam | VNM | C12345678VNM |

## Important Limitations

### Transaction Limits
- **Per Transaction**: Check with your bank for limits
- **Daily Limit**: Cumulative daily transfer limit applies
- **Per Recipient**: Maximum amount per recipient per day

### File Upload Restrictions
- **Unique Filenames**: Each filename can only be uploaded once
- **No Duplicates**: Cannot upload the same batch twice
- **Format**: Must be in Excel format (.xlsx)

### Processing Windows
- **Future Dating**: Maximum 60 days in advance
- **No Backdating**: Cannot select past dates
- **Instant Processing**: Transfers are immediate once approved

## Error Handling

### Common Errors and Solutions

#### "Missing Recipient ID"
- **Cause**: Some recipients don't have IC/Passport numbers
- **Solution**: Update candidate profiles with valid IDs

#### "Invalid Passport Format"
- **Cause**: Passport contains invalid characters
- **Solution**: Use only letters and numbers, no spaces

#### "Duplicate Filename"
- **Cause**: File with same name already uploaded
- **Solution**: Generate new export with updated timestamp

## Best Practices

### Before Export
1. **Verify Recipient IDs**: Ensure all staff have valid IC/Passport
2. **Check Payment Amounts**: Confirm amounts are correct
3. **Review Recipient Names**: Double-check for accuracy

### During Export
1. **Select Correct Date**: Match with your payment schedule
2. **Note Batch Reference**: Keep for tracking purposes
3. **Save Generated File**: Store in secure location

### After Export
1. **Upload Promptly**: Upload to bank portal immediately
2. **Verify Processing**: Check bank portal for status
3. **Keep Records**: Archive exported files for audit trail

## Security Reminders

⚠️ **Important Security Notes**:
- Beneficiary names are NOT validated by banks
- Always verify recipient details before export
- PIDM protection does not apply after transfer
- Keep export files secure and encrypted
- Never share files via unsecured channels

## Comparison with Other Methods

| Feature | DuitNow | IBG | RENTAS |
|---------|---------|-----|--------|
| **Speed** | Instant | Next business day | Immediate |
| **Cost** | Low | Medium | High |
| **ID Required** | Yes (IC/Passport) | No | Yes (IC only) |
| **Availability** | 24/7 | Business hours | Business hours |
| **Best For** | Regular payroll | Standard transfers | Urgent/High-value |

## Troubleshooting

### Export Button Disabled
- Check if batch has been approved
- Verify user has export permissions
- Ensure batch contains valid payments

### File Won't Generate
- Check browser popup blocker settings
- Verify sufficient system memory
- Try different browser if issue persists

### Bank Portal Rejects File
- Verify filename hasn't been used before
- Check payment date matches portal date
- Ensure all mandatory fields are filled

## Support Resources

- **User Guide**: Available in Payment folder
- **Country Codes List**: Full ISO country codes reference
- **Bank Support**: Contact your bank's corporate support
- **System Support**: Contact Baito AI support team

## Audit Trail

All DuitNow exports are logged with:
- Export timestamp
- User who exported
- Batch reference
- File generated
- Payment details

Access audit logs from the Payments page for compliance reporting.