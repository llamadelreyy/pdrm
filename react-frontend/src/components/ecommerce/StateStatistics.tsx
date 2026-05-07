import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import MalaysiaMap from "./MalaysiaMap";

interface StateData {
  code: string;
  name: string;
  saman: number;
  percentage: number;
}

const stateData: StateData[] = [
  { code: "MY-14", name: "Kuala Lumpur", saman: 2379, percentage: 85 },
  { code: "MY-12", name: "Selangor", saman: 1892, percentage: 68 },
  { code: "MY-01", name: "Johor", saman: 1456, percentage: 52 },
  { code: "MY-11", name: "Sarawak", saman: 1345, percentage: 48 },
  { code: "MY-10", name: "Sabah", saman: 1123, percentage: 40 },
  { code: "MY-07", name: "Perak", saman: 987, percentage: 35 },
  { code: "MY-09", name: "Pulau Pinang", saman: 987, percentage: 35 },
  { code: "MY-02", name: "Kedah", saman: 876, percentage: 31 },
  { code: "MY-06", name: "Pahang", saman: 765, percentage: 27 },
  { code: "MY-03", name: "Kelantan", saman: 654, percentage: 23 },
  { code: "MY-13", name: "Terengganu", saman: 567, percentage: 20 },
  { code: "MY-05", name: "Negeri Sembilan", saman: 543, percentage: 19 },
  { code: "MY-04", name: "Melaka", saman: 432, percentage: 15 },
  { code: "MY-08", name: "Perlis", saman: 234, percentage: 8 },
];

export default function StateStatistics() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleStateClick = (code: string, name: string) => {
    const state = stateData.find(s => s.code === code || s.name === name);
    if (state) {
      setSelectedState(state);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Saman Mengikut Negeri
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Taburan di seluruh Malaysia
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Lihat Lagi
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Padam
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Map Container */}
      <div className="px-4 py-4 my-4 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <MalaysiaMap onRegionClick={handleStateClick} />
      </div>

      {/* Selected State Info */}
      {selectedState && (
        <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {selectedState.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedState.saman.toLocaleString()} saman direkodkan
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-red-500">
                {selectedState.percentage}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* State List */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {stateData.slice(0, 6).map((state) => (
          <div key={state.code} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  {state.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                  {state.name}
                </p>
                <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                  {state.saman.toLocaleString()} saman
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-[100px] items-center gap-2">
              <div className="relative block h-2 w-full rounded-sm bg-gray-200 dark:bg-gray-700">
                <div
                  className="absolute left-0 top-0 flex h-full rounded-sm bg-red-500"
                  style={{ width: `${state.percentage}%` }}
                ></div>
              </div>
              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90 w-8 text-right">
                {state.percentage}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
