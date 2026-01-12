import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation Resources
const resources = {
    en: {
        translation: {
            common: {
                syncing: 'Syncing Matrix',
                error: 'System Error',
                loading: 'Loading...',
                nav: {
                    feed: "Feed",
                    vision: "Scanner",
                    market: "Rewards",
                    matrix: "Matrix",
                    profile: "Profile",
                    logs: "Logs"
                }
            },
            feed: {
                impact_report: 'Impact Report',
                impact_subtitle: 'Share your eco-actions',
                daily_insight: 'Daily Insight',
                loading: 'Loading Feed...'
            },
            vision: {
                title: "Vision Unit",
                subtitle: "Deploy AI sensors to categorize environment data",
                engage: "Engage Sensor",
                ready: "Environment Scanning Ready",
                analyzing: "Analyzing Bio-Data...",
                identified: "Identified Unit",
                allocation: "Allocation",
                confirm: "Confirm Protocol",
                reset: "Reset Sensor",
                scan_tip: 'Point camera at waste item'
            },
            market: {
                title: "Exchange Center",
                subtitle: "Asset Allocation",
                balance: "Available Balance",
                authorize: "Authorize Exchange"
            },
            profile: {
                title: "Identity Profile",
                logout: "Terminate Session",
                rank_status: "Global Ranking Status",
                merits: "Operational Merits",
                deployment: "DEPLOYMENT",
                asset_calibration: "Asset Calibration",
                protocol_settings: "Protocol Settings",
                manage_keys: "Manage unit keys and data authorization",
                system_version: "System Version 2.5.0-Light",
                no_merits: "No merits authenticated in this cycle.",
                rank_unit: "Rank {{rank}} Unit"
            },
            leaderboard: {
                performance: 'System Performance',
                elite_units: 'Elite Units',
                individual: 'Individual',
                deployment: 'Deployment',
                no_data: 'No node data synchronized.'
            },
            logger: {
                resource_logging: 'Resource Logging',
                activity_hub: 'Activity Hub',
                walk: 'Walk',
                bicycle: 'Bicycle',
                public_transport: 'Public Transport',
                out_of_time: 'Outside Logging Window',
                morning_done: 'Morning Log Complete',
                afternoon_done: 'Afternoon Log Complete',
                transport: 'Transport',
                travel: 'Transit',
                planting: 'Planting',
                energy: 'Energy',
                energy_saving: 'Energy Conservation',
                green_area: 'Green Area Expansion',
                success: 'Log Synchronized',
                eco_transit: 'Log Eco-Transit',
                log_activity: 'Log Activity',
                green_evidence: 'Attach evidence (Photo/Video)',
                energy_evidence: 'Photo of turned off appliance',
                select_file: 'Select File',
                submit_evidence: 'Submit Evidence'
            },
            layout: {
                eco_guardian: 'ECO-GUARDIAN UNIT'
            }
        }
    },
    th: {
        translation: {
            common: {
                syncing: 'กำลังซิงค์ข้อมูล',
                error: 'ระบบขัดข้อง',
                loading: 'กำลังโหลด...',
                nav: {
                    feed: "หน้าหลัก",
                    vision: "สแกนขยะ",
                    market: "แลกรางวัล",
                    matrix: "แจ้งปัญหา",
                    profile: "โปรไฟล์",
                    logs: "บันทึก"
                }
            },
            feed: {
                impact_report: 'รายงานผล',
                impact_subtitle: 'แบ่งปันการทำดีของคุณ',
                daily_insight: 'เกร็ดความรู้',
                loading: 'กำลังโหลดฟีด...'
            },
            vision: {
                title: "ระบบสแกน",
                subtitle: "ใช้ AI วิเคราะห์และแยกประเภทขยะ",
                engage: "เริ่มสแกน",
                ready: "พร้อมใช้งาน",
                analyzing: "กำลังประมวลผล...",
                identified: "วัตถุที่ตรวจพบ",
                allocation: "แต้มที่ได้",
                confirm: "ยืนยัน",
                reset: "ถ่ายใหม่",
                scan_tip: 'ส่องกล้องไปที่ขยะ'
            },
            market: {
                title: "ร้านค้า",
                subtitle: "แลกของรางวัล",
                balance: "ยอดคงเหลือ",
                authorize: "แลกรางวัล"
            },
            profile: {
                title: "ข้อมูลส่วนตัว",
                logout: "ออกจากระบบ",
                rank_status: "อันดับของคุณ",
                merits: "เหรียญตรา",
                deployment: "สังกัด",
                asset_calibration: "ทรัพย์สิน",
                protocol_settings: "การตั้งค่า",
                manage_keys: "จัดการบัญชีและการเข้าถึงข้อมูล",
                system_version: "เวอร์ชันระบบ 2.5.0-Light",
                no_merits: "ไม่มีเหรียญตราในรอบนี้",
                rank_unit: "ระดับ {{rank}}"
            },
            leaderboard: {
                performance: 'ผลการดำเนินงาน',
                elite_units: 'ผู้ใช้งานยอดเยี่ยม',
                individual: 'บุคคล',
                deployment: 'ห้องเรียน',
                no_data: 'ไม่พบข้อมูลในระบบ'
            },
            logger: {
                resource_logging: 'บันทึกกิจกรรม',
                activity_hub: 'ศูนย์ปฏิบัติการ',
                walk: 'เดินเท้า',
                bicycle: 'จักรยาน',
                public_transport: 'รถสาธารณะ',
                out_of_time: 'อยู่นอกเวลาบันทึก',
                morning_done: 'บันทึกช่วงเช้าแล้ว',
                afternoon_done: 'บันทึกช่วงเย็นแล้ว',
                transport: 'การเดินทาง',
                travel: 'เดินทาง',
                planting: 'ปลูกต้นไม้',
                energy: 'พลังงาน',
                energy_saving: 'ประหยัดพลังงาน',
                green_area: 'เพิ่มพื้นที่สีเขียว',
                success: 'บันทึกสำเร็จ',
                eco_transit: 'บันทึกการเดินทาง',
                log_activity: 'ยืนยัน',
                green_evidence: 'แนบหลักฐาน (รูป/วิดีโอ)',
                energy_evidence: 'รูปการปิดไฟ/แอร์',
                select_file: 'เลือกไฟล์',
                submit_evidence: 'ส่งหลักฐาน'
            },
            layout: {
                eco_guardian: 'หน่วยพิทักษ์รักษ์โลก'
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'th',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
