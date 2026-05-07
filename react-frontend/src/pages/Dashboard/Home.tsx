import TrafficMetrics from "../../components/ecommerce/TrafficMetrics";
import SamanTrendChart from "../../components/ecommerce/SamanTrendChart";
import EnforcementStatsChart from "../../components/ecommerce/EnforcementStatsChart";
import EnforcementTarget from "../../components/ecommerce/EnforcementTarget";
import RecentSamanTable from "../../components/ecommerce/RecentSamanTable";
import StateStatistics from "../../components/ecommerce/StateStatistics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Papan Pemuka Penguatkuasaan Trafik PDRM"
        description="Papan Pemuka Penguatkuasaan Trafik PDRM - Pemantauan pengeluaran saman, rekod kenderaan, integrasi JPJ, dan operasi penguatkuasaan"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Top Row: Metrics - Full Width */}
        <div className="col-span-12">
          <TrafficMetrics />
        </div>

        {/* Second Row: State Statistics with Map - Full Width */}
        <div className="col-span-12">
          <StateStatistics />
        </div>

        {/* Third Row: Saman Trend Chart (wider) + Enforcement Target */}
        <div className="col-span-12 xl:col-span-8">
          <SamanTrendChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <EnforcementTarget />
        </div>

        {/* Fourth Row: Enforcement Stats (full width) */}
        <div className="col-span-12">
          <EnforcementStatsChart />
        </div>

        {/* Fifth Row: Recent Saman Table - Full Width */}
        <div className="col-span-12">
          <RecentSamanTable />
        </div>
      </div>
    </>
  );
}
