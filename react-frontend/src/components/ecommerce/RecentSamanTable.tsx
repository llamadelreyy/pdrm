import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface SamanRecord {
  id: number;
  plateNumber: string;
  driverName: string;
  offense: string;
  location: string;
  amount: string;
  status: "Paid" | "Pending" | "Blacklisted";
  date: string;
}

const tableData: SamanRecord[] = [
  {
    id: 1,
    plateNumber: "WAB 1234",
    driverName: "Ahmad bin Ali",
    offense: "Running red light",
    location: "Jalan Bukit Bintang",
    amount: "RM300",
    status: "Pending",
    date: "2024-01-15",
  },
  {
    id: 2,
    plateNumber: "KLM 5678",
    driverName: "Lim Wei Ming",
    offense: "Speeding",
    location: "Lebuhraya Utara-Selatan",
    amount: "RM250",
    status: "Paid",
    date: "2024-01-14",
  },
  {
    id: 3,
    plateNumber: "JHR 9012",
    driverName: "Mohd Razak",
    offense: "Illegal parking",
    location: "Jalan Sultan Ismail",
    amount: "RM100",
    status: "Paid",
    date: "2024-01-13",
  },
  {
    id: 4,
    plateNumber: "PJ 3456",
    driverName: "Tan Ah Kow",
    offense: "Using mobile while driving",
    location: "Jalan Tun Razak",
    amount: "RM150",
    status: "Blacklisted",
    date: "2024-01-12",
  },
  {
    id: 5,
    plateNumber: "SL 7890",
    driverName: "Siti Nurhaliza",
    offense: "Not wearing seatbelt",
    location: "Jalan Ampang",
    amount: "RM150",
    status: "Pending",
    date: "2024-01-11",
  },
];

export default function RecentSamanTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Saman Issued
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Latest traffic violations recorded
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 5.90393L13.9741 9.5L17.7075 13.0961"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.29004 5.90393L5.88544 9.5L2.29004 13.0961"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Plate Number
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Driver Name
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Offense
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Location
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-semibold text-gray-800 dark:text-white/90"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((saman) => (
              <TableRow key={saman.id}>
                <TableCell className="py-3 text-gray-700 dark:text-gray-400">
                  {saman.plateNumber}
                </TableCell>
                <TableCell className="py-3 text-gray-700 dark:text-gray-400">
                  {saman.driverName}
                </TableCell>
                <TableCell className="py-3 text-gray-700 dark:text-gray-400">
                  {saman.offense}
                </TableCell>
                <TableCell className="py-3 text-gray-700 dark:text-gray-400">
                  {saman.location}
                </TableCell>
                <TableCell className="py-3 text-gray-700 dark:text-gray-400">
                  {saman.amount}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    color={
                      saman.status === "Paid"
                        ? "success"
                        : saman.status === "Pending"
                        ? "warning"
                        : "error"
                    }
                  >
                    {saman.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
