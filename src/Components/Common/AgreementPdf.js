import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logoSm from "../../assets/images/heybe-logo.png";


const styles = StyleSheet.create({
    page: {
        padding: 56,
        fontSize: 10.5,
        // fontFamily: 'Inter',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        lineHeight: 1.5,
    },
    // Premium Header with Gold Accent
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: '#C5A572',
        paddingBottom: 10,
    },
    logoSection: {
        flexDirection: 'column',
    },
    logo: {
        width: 100,
        height: 70,
        // marginBottom: 12,
    },
    companyTagline: {
        fontSize: 8,
        color: '#6B7280',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    referenceSection: {
        alignItems: 'flex-end',
    },
    referenceLabel: {
        fontSize: 8,
        color: '#6B7280',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    referenceValue: {
        fontSize: 14,
        // fontFamily: 'LibreBaskerville',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    referenceDate: {
        fontSize: 9,
        color: '#9CA3AF',
        marginTop: 4,
    },
    // Elegant Title
    titleSection: {
        marginBottom: 32,
        textAlign: 'center',
    },
    title: {
        fontSize: 24,
        // fontFamily: 'LibreBaskerville',
        color: '#1F2937',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    titleUnderline: {
        width: 80,
        height: 2,
        backgroundColor: '#C5A572',
        marginHorizontal: 'auto',
        marginTop: 8,
    },
    // Party Information - Corporate Style
    partiesSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        backgroundColor: '#F9FAFB',
        padding: 24,
        borderRadius: 4,
    },
    partyBlock: {
        flex: 1,
    },
    partyDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 24,
    },
    partyLabel: {
        fontSize: 9,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    partyName: {
        fontSize: 16,
        // fontFamily: 'LibreBaskerville',
        color: '#1F2937',
        marginBottom: 8,
    },
    partyDetails: {
        fontSize: 9,
        color: '#4B5563',
        marginBottom: 4,
    },
    // Section Headers - Legal Style
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    sectionNumber: {
        width: 24,
        height: 24,
        backgroundColor: '#C5A572',
        borderRadius: 2,
        color: 'white',
        fontSize: 12,
        // fontFamily: 'LibreBaskerville',
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 14,
        // fontFamily: 'LibreBaskerville',
        color: '#1F2937',
        letterSpacing: 0.5,
    },
    // Content Typography
    text: {
        fontSize: 10.5,
        color: '#374151',
        marginBottom: 12,
        lineHeight: 1.6,
    },
    textBold: {
        fontWeight: 700,
        color: '#1F2937',
    },
    // Commission Table - Corporate Style
    tableContainer: {
        marginVertical: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tableHeaderCell: {
        flex: 1,
        fontSize: 9,
        fontWeight: 700,
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tableCell: {
        flex: 1,
        fontSize: 10.5,
        color: '#4B5563',
    },
    // Clauses
    clause: {
        marginBottom: 16,
        paddingLeft: 16,
        borderLeftWidth: 2,
        borderLeftColor: '#C5A572',
    },
    clauseTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: '#1F2937',
        marginBottom: 6,
    },
    // Signature Section - Executive Style
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 48,
        marginBottom: 32,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    signatureBlock: {
        flex: 1,
    },
    signatureLine: {
        width: '80%',
        height: 1,
        backgroundColor: '#1F2937',
        marginTop: 40,
        marginBottom: 8,
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 700,
        color: '#1F2937',
        marginBottom: 2,
    },
    signatureTitle: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 4,
    },
    signatureDate: {
        fontSize: 9,
        color: '#9CA3AF',
    },
    seal: {
        marginTop: 16,
        fontSize: 8,
        color: '#C5A572',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    // Footer - Law Firm Style
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 56,
        right: 56,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerLeft: {
        flexDirection: 'column',
    },
    footerRight: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    footerText: {
        fontSize: 8,
        color: '#9CA3AF',
        letterSpacing: 0.3,
    },
    footerBold: {
        fontSize: 8,
        fontWeight: 700,
        color: '#4B5563',
        letterSpacing: 0.3,
    },
    // Confidentiality Badge
    confidentiality: {
        position: 'absolute',
        top: 56,
        right: 56,
        fontSize: 8,
        color: '#C5A572',
        borderWidth: 1,
        borderColor: '#C5A572',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
        letterSpacing: 1,
        transform: 'rotate(2deg)',
    },
});

const AgreementPdf = ({ business, admin = {
    name: "Abdishakur Abdullahi",
    title: "Chief Operating Officer",
    department: "Legal Affairs"
} }) => {
    const agreementId = business.agreementReference || `KMC-${business._id?.slice(0, 8).toUpperCase()}`;
    const currentDate = new Date();

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const commissionRate = business.contract?.commissionRate || 5;
    const payoutSchedule = business.contract?.payoutSchedule || 'WEEKLY';
    const currency = business.currency || 'USD';

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Confidentiality Notice */}
                <Text style={styles.confidentiality}>CONFIDENTIAL</Text>

                {/* Premium Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Image src={logoSm} style={styles.logo} />
                        {/* <Text style={styles.companyTagline}>SURPLUS FOOD SAVER PLATFORM</Text> */}
                    </View>
                    <View style={styles.referenceSection}>
                        <Text style={styles.referenceLabel}>AGREEMENT REFERENCE</Text>
                        <Text style={styles.referenceValue}>{agreementId}</Text>
                        <Text style={styles.referenceDate}>Executed: {formatDate(currentDate)}</Text>
                    </View>
                </View>

                {/* Elegant Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>SERVICE & COMMISSION AGREEMENT</Text>
                    <View style={styles.titleUnderline} />
                </View>

                {/* Corporate Party Information */}
                <View style={styles.partiesSection}>
                    <View style={styles.partyBlock}>
                        <Text style={styles.partyLabel}>THE PLATFORM</Text>
                        <Text style={styles.partyName}>apartment Inc.</Text>
                        <Text style={styles.partyDetails}>A digitally registered entity</Text>
                        <Text style={styles.partyDetails}>License: KMC-2024-00123</Text>
                        <Text style={styles.partyDetails}>VAT: KM-87654321</Text>
                    </View>
                    <View style={styles.partyDivider} />
                    <View style={styles.partyBlock}>
                        <Text style={styles.partyLabel}>THE BUSINESS</Text>
                        <Text style={styles.partyName}>{business.businessName}</Text>
                        <Text style={styles.partyDetails}>Authorized Representative: {business.ownerName || 'Business Owner'}</Text>
                        <Text style={styles.partyDetails}>Registration: {business.registrationNumber || 'Pending'}</Text>
                        <Text style={styles.partyDetails}>Tax ID: {business.taxId || 'Not Provided'}</Text>
                    </View>
                </View>

                {/* Section 1: Definitions & Interpretation */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>1</Text>
                        <Text style={styles.sectionTitle}>DEFINITIONS & INTERPRETATION</Text>
                    </View>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>1.1 </Text>
                        In this Agreement, unless the context otherwise requires, the following terms shall have the meanings ascribed to them:
                    </Text>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>"Platform"</Text>
                        <Text style={styles.text}>means the apartment digital marketplace, mobile application, and associated systems operated by apartment Inc.</Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>"Business"</Text>
                        <Text style={styles.text}>means {business.businessName}, a registered business entity entering into this Agreement with the Platform.</Text>
                    </View>
                    <View style={styles.clause}>
                        <Text style={styles.clauseTitle}>"Services"</Text>
                        <Text style={styles.text}>means the technology, marketing, payment processing, and operational services provided by the Platform to the Business.</Text>
                    </View>
                </View>

                {/* Section 2: Commercial Terms - Corporate Table */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>2</Text>
                        <Text style={styles.sectionTitle}>COMMERCIAL TERMS</Text>
                    </View>

                    <View style={styles.tableContainer}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>Commercial Term</Text>
                            <Text style={styles.tableHeaderCell}>Value</Text>
                            <Text style={styles.tableHeaderCell}>Schedule</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Commission Rate</Text>
                            <Text style={[styles.tableCell, styles.textBold]}>{commissionRate}%</Text>
                            <Text style={styles.tableCell}>Per Transaction</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Payout Frequency</Text>
                            <Text style={[styles.tableCell, styles.textBold]}>{payoutSchedule}</Text>
                            <Text style={styles.tableCell}>Every {payoutSchedule === 'WEEKLY' ? 'Monday' : '1st of Month'}</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Settlement Currency</Text>
                            <Text style={[styles.tableCell, styles.textBold]}>{currency}</Text>
                            <Text style={styles.tableCell}>USD Equivalent</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>Minimum Payout</Text>
                            <Text style={[styles.tableCell, styles.textBold]}>$50.00</Text>
                            <Text style={styles.tableCell}>Threshold</Text>
                        </View>
                    </View>

                    <Text style={styles.text}>
                        <Text style={styles.textBold}>2.2 </Text>
                        The Platform shall deduct the applicable commission from each completed transaction before remitting the balance to the Business. All commission rates are exclusive of applicable taxes.
                    </Text>
                </View>

                {/* Section 3: Business Obligations */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>3</Text>
                        <Text style={styles.sectionTitle}>BUSINESS OBLIGATIONS</Text>
                    </View>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>3.1 </Text>
                        The Business covenants and agrees to:
                    </Text>
                    <Text style={styles.text}>• Maintain all requisite licenses, permits, and certifications required by applicable law;</Text>
                    <Text style={styles.text}>• Ensure all products listed on the Platform are safe, consumable, and accurately described;</Text>
                    <Text style={styles.text}>• Fulfill all customer orders promptly and maintain a minimum 98% fulfillment rate;</Text>
                    <Text style={styles.text}>• Respond to customer inquiries within 24 hours during business operations;</Text>
                    <Text style={styles.text}>• Maintain adequate inventory levels and update availability in real-time;</Text>
                    <Text style={styles.text}>• Comply with all food safety regulations and industry standards;</Text>
                    <Text style={styles.text}>• Not engage in any practice that would harm the Platform's reputation or brand.</Text>
                </View>

                {/* Section 4: Platform Services */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>4</Text>
                        <Text style={styles.sectionTitle}>PLATFORM SERVICES</Text>
                    </View>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>4.1 </Text>
                        apartment shall provide the Business with:
                    </Text>
                    <Text style={styles.text}>• Access to the Platform's digital marketplace and customer base;</Text>
                    <Text style={styles.text}>• Inventory management and order processing systems;</Text>
                    <Text style={styles.text}>• Secure payment processing and automated settlement services;</Text>
                    <Text style={styles.text}>• Marketing and promotional opportunities on the Platform;</Text>
                    <Text style={styles.text}>• Analytics dashboard and performance reporting tools;</Text>
                    <Text style={styles.text}>• Dedicated account management and technical support.</Text>
                </View>

                {/* Section 5: Term & Termination */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>5</Text>
                        <Text style={styles.sectionTitle}>TERM & TERMINATION</Text>
                    </View>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>5.1 </Text>
                        This Agreement shall commence on the date of execution and continue until terminated in accordance with this Section 5.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>5.2 </Text>
                        Either party may terminate this Agreement by providing thirty (30) days' written notice to the other party.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.textBold}>5.3 </Text>
                        The Platform may terminate this Agreement immediately upon written notice if the Business:
                    </Text>
                    <Text style={styles.text}>• Materially breaches any provision of this Agreement;</Text>
                    <Text style={styles.text}>• Engages in fraudulent or deceptive conduct;</Text>
                    <Text style={styles.text}>• Violates applicable laws or regulations;</Text>
                    <Text style={styles.text}>• Becomes insolvent or enters bankruptcy proceedings.</Text>
                </View>

                {/* Section 6: Governing Law */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionNumber}>6</Text>
                        <Text style={styles.sectionTitle}>GOVERNING LAW & JURISDICTION</Text>
                    </View>
                    <Text style={styles.text}>
                        This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Somalia. Any dispute arising out of or in connection with this Agreement shall be submitted to the exclusive jurisdiction of the courts of Mogadishu, Somalia.
                    </Text>
                </View>

                {/* Executive Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.partyLabel}>EXECUTED FOR THE PLATFORM</Text>
                        <Text style={styles.signatureName}>apartment Inc.</Text>
                        <Text style={styles.signatureTitle}>{admin.name}</Text>
                        <Text style={styles.signatureTitle}>{admin.title}, {admin.department}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Authorized Signature</Text>
                        <Text style={styles.signatureDate}>Date: {formatDate(currentDate)}</Text>
                        <Text style={styles.seal}>CORPORATE SEAL</Text>
                    </View>

                    <View style={styles.signatureBlock}>
                        <Text style={styles.partyLabel}>EXECUTED FOR THE BUSINESS</Text>
                        <Text style={styles.signatureName}>{business.businessName}</Text>
                        <Text style={styles.signatureTitle}>{business.ownerName || 'Authorized Representative'}</Text>
                        <Text style={styles.signatureTitle}>Authorized Signatory</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureName}>Authorized Signature</Text>
                        <Text style={styles.signatureDate}>Date: {formatDate(currentDate)}</Text>
                        <Text style={styles.seal}>BUSINESS SEAL</Text>
                    </View>
                </View>

                {/* Professional Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.footerBold}>apartment Inc.</Text>
                        <Text style={styles.footerText}>Surplus Food Saver Platform</Text>
                        <Text style={styles.footerText}>www.apartment.com | legal@apartment.com</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={styles.footerBold}>Document ID: {agreementId}</Text>
                        <Text style={styles.footerText}>Generated: {formatDateTime(currentDate)}</Text>
                        <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        } />
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default AgreementPdf;
