import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Edit2, FileText, Download, ChevronRight, Calculator, User, MapPin, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function InvoiceGenerator() {
    const navigate = useNavigate();
    const location = useLocation();
    const [viewMode, setViewMode] = useState('form'); // 'form' or 'preview'

    // Initial State
    const [invoiceData, setInvoiceData] = useState({
        billDate: new Date().toISOString().split('T')[0],
        customerId: '',
        name: '',
        address: '',
        printDate: new Date().toLocaleString(),
        sqn: '',
        userId: '',
        billMonth: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
        zone: '',
        ref: '',
        invNo: `INV${Math.floor(Math.random() * 1000000000)}`,
        lastRead: 0,
        currentRead: 0,
        rate: 0.41
    });

    useEffect(() => {
        // 1. Load User Info
        const loadUser = async () => {
            const userStr = localStorage.getItem('beco_current_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setInvoiceData(prev => ({
                    ...prev,
                    userId: user.username || user.full_name || user.id.substring(0, 6),
                    zone: user.zone || prev.zone
                }));
            }
        };
        loadUser();

        // 2. Load Customer from Navigation State
        if (location.state?.customer) {
            const c = location.state.customer;
            setInvoiceData(prev => ({
                ...prev,
                customerId: c.sqn || prev.customerId,
                name: c.name || prev.name,
                address: c.district || prev.address,
                sqn: c.sqn || prev.sqn,
                lastRead: c.prev || c.prevBalance || 0,
                currentRead: c.balance || 0 // Assuming balance might track current read? Probably not, but good default.
                // In reality, current read is entered manually usually.
            }));
        }
    }, [location.state]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    // Derived Calculations
    const usage = Math.max(0, parseFloat(invoiceData.currentRead) - parseFloat(invoiceData.lastRead));
    const netKwt = usage;
    const totalBill = (netKwt * parseFloat(invoiceData.rate)).toFixed(2);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navigation Bar (Hidden on Print) */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
                <button
                    onClick={() => viewMode === 'preview' ? setViewMode('form') : navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 font-bold transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    {viewMode === 'preview' ? 'Back to Edit' : 'Dashboard'}
                </button>
                <div className="font-black text-lg text-gray-900 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs mr-2 ${viewMode === 'form' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {viewMode === 'form' ? 'Step 1: Enter Data' : 'Step 2: Preview & Download'}
                    </span>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-6 pb-24">

                {/* FORM VIEW */}
                {viewMode === 'form' && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                            <div className="bg-gray-900 p-8 text-white">
                                <h1 className="text-3xl font-black mb-2">Create Invoice</h1>
                                <p className="text-gray-400">Enter customer details and readings to generate a compliant bill.</p>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Section 1: Customer */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <User size={16} className="mr-2" /> Customer Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Full Name" name="name" value={invoiceData.name} onChange={handleInputChange} full />
                                        <InputGroup label="Address / Location" name="address" value={invoiceData.address} onChange={handleInputChange} icon={MapPin} />
                                        <InputGroup label="Customer ID" name="customerId" value={invoiceData.customerId} onChange={handleInputChange} />
                                        <InputGroup label="SQN Number" name="sqn" value={invoiceData.sqn} onChange={handleInputChange} />
                                        <InputGroup label="User ID (Agent)" name="userId" value={invoiceData.userId} onChange={handleInputChange} />
                                        <InputGroup label="Zone" name="zone" value={invoiceData.zone} onChange={handleInputChange} />
                                    </div>
                                </div>

                                {/* Section 2: Readings */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <Zap size={16} className="mr-2" /> Meter Readings
                                    </h3>
                                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputGroup label="Previous Reading" name="lastRead" type="number" value={invoiceData.lastRead} onChange={handleInputChange} />
                                            <InputGroup label="Current Reading" name="currentRead" type="number" value={invoiceData.currentRead} onChange={handleInputChange} />
                                            <InputGroup label="Tariff Rate ($)" name="rate" type="number" value={invoiceData.rate} onChange={handleInputChange} />
                                            <div className="col-span-1 flex flex-col justify-end">
                                                <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm flex items-center justify-between">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Usage</span>
                                                    <span className="font-black text-gray-900">{usage.toFixed(2)} Kw</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-100 flex justify-between items-center">
                                            <span className="font-bold text-gray-500">Estimated Bill</span>
                                            <span className="text-3xl font-black text-gray-900">${totalBill}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Meta */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                        <FileText size={16} className="mr-2" /> Invoice Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Bill Month" name="billMonth" value={invoiceData.billMonth} onChange={handleInputChange} />
                                        <InputGroup label="Ref Number" name="ref" value={invoiceData.ref} onChange={handleInputChange} />
                                        <InputGroup label="Invoice Number" name="invNo" value={invoiceData.invNo} onChange={handleInputChange} full />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform flex items-center"
                                >
                                    <Calculator size={20} className="mr-2" />
                                    Generate Invoice
                                    <ChevronRight size={20} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PREVIEW VIEW */}
                {viewMode === 'preview' && (
                    <div className="flex flex-col items-center">
                        {/* Action Bar */}
                        <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 flex items-center transition-colors"
                            >
                                <Download size={20} className="mr-2" />
                                Download PDF / Print
                            </button>
                        </div>

                        <style>
                            {`
                            @media print {
                                @page { size: A4 landscape; margin: 0; }
                                body * { visibility: hidden; }
                                #invoice-content, #invoice-content * { visibility: visible; }
                                #invoice-content { position: absolute; left: 0; top: 0; margin: 0; padding: 0; width: 297mm !important; }
                            }
                            `}
                        </style>

                        {/* THE OFFICIAL INVOICE (A4) */}
                        <div className="overflow-x-auto pb-10 flex justify-center w-full">
                            <div id="invoice-content" className="w-[210mm] min-w-[210mm] bg-white p-12 shadow-xl print:shadow-none print:w-[210mm] min-h-[297mm] text-gray-900 relative bg-white mx-auto print:mx-0">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <img src="/beco_logo.png" alt="Beco Logo" className="h-16 object-contain" />
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-800">Warshadaha Branch , Tel : Call Center: 333</p>
                                        <h1 className="text-3xl font-black text-gray-900 mt-2">Bill Invoice</h1>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-x-12 gap-y-1 mb-6 text-sm">
                                    <InfoRow label="Bill_date:" value={invoiceData.billDate} />
                                    <InfoRow label="Customer id:" value={invoiceData.customerId} />
                                    <InfoRow label="Name:" value={invoiceData.name} />
                                    <InfoRow label="Address:" value={invoiceData.address} />
                                    <InfoRow label="Print Date:" value={invoiceData.printDate} />
                                    <div className="h-4"></div> {/* Spacer */}
                                    <InfoRow label="SQN:" value={invoiceData.sqn} />
                                    <InfoRow label="User ID:" value={invoiceData.userId} />
                                    <InfoRow label="bill_month:" value={invoiceData.billMonth} />
                                    <InfoRow label="Zone:" value={invoiceData.zone} />
                                    <InfoRow label="Ref:" value={invoiceData.ref} />
                                </div>

                                {/* Table */}
                                <div className="border border-gray-400 mb-6 font-sans">
                                    <div className="grid grid-cols-8 bg-gray-200 border-b border-gray-400 font-bold text-xs uppercase">
                                        <div className="p-2 border-r border-gray-400 col-span-2">Inv no</div>
                                        <div className="p-2 border-r border-gray-400">Last Read</div>
                                        <div className="p-2 border-r border-gray-400">Current Read</div>
                                        <div className="p-2 border-r border-gray-400">Usage</div>
                                        <div className="p-2 border-r border-gray-400">KWE</div>
                                        <div className="p-2 border-r border-gray-400">Net KWT</div>
                                        <div className="p-2">Rate</div>
                                    </div>

                                    <div className="grid grid-cols-8 text-xs font-medium relative h-24">
                                        <div className="p-2 border-r border-gray-400 col-span-2 border-b border-gray-400">{invoiceData.invNo}</div>
                                        <div className="p-2 border-r border-gray-400 border-b border-gray-400">{Number(invoiceData.lastRead).toFixed(1)}</div>
                                        <div className="p-2 border-r border-gray-400 border-b border-gray-400">{Number(invoiceData.currentRead).toFixed(2)}</div>
                                        <div className="p-2 border-r border-gray-400 border-b border-gray-400">{usage.toFixed(2)}</div>
                                        <div className="p-2 border-r border-gray-400 border-b border-gray-400">1</div>
                                        <div className="p-2 border-r border-gray-400 border-b border-gray-400">{netKwt.toFixed(2)}</div>

                                        {/* Rate & Totals */}
                                        <div className="col-span-1 border-b border-gray-400">
                                            <div className="p-2 border-b border-gray-400 h-8">{invoiceData.rate}</div>
                                            <div className="p-2 font-bold h-8 flex items-center">Balance:</div>
                                            <div className="p-2 font-black h-8 flex items-center">Total Amount:</div>
                                        </div>

                                        {/* Grand Total Overlay */}
                                        <div className="absolute right-0 top-0 w-[12.5%] h-full border-l border-gray-400 bg-gray-50/10">
                                            <div className="p-2 border-b border-gray-400 text-center font-bold h-8 border-gray-400 bg-gray-200">TotalBill</div>
                                            <div className="p-2 border-b border-gray-400 h-8 flex items-center justify-start font-medium">${totalBill}</div>
                                            <div className="p-2 border-b border-gray-400 h-8 flex items-center justify-start font-medium">$ 0.00</div>
                                            <div className="p-2 h-8 flex items-center justify-start font-black text-gray-900 border-b border-gray-400">$ {totalBill}</div>
                                        </div>
                                    </div>

                                    {/* Padding Rows */}
                                    <div className="grid grid-cols-8 text-xs h-8 border-b border-gray-400"><div className="col-span-8"></div></div>
                                    <div className="grid grid-cols-8 text-xs h-8"><div className="col-span-8"></div></div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 border-t border-gray-300 pt-2">
                                    <p className="text-xs text-gray-800 font-medium">
                                        Note: For the Service Continuation, Dear Valued Customer, Please Pay the Electricity Bills Before <span className="font-bold">5<sup>th</sup></span> of Every Month.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InputGroup({ label, name, value, onChange, type = "text", full, icon: Icon }) {
    return (
        <div className={full ? "col-span-2" : "col-span-1"}>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center">
                {Icon && <Icon size={12} className="mr-1" />} {label}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
            />
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex">
            <span className="font-bold w-32 flex-shrink-0">{label}</span>
            <span className="font-medium text-gray-700 truncate">{value}</span>
        </div>
    );
}
