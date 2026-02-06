"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { Store, StoreStatus } from "@/src/types/store";
import {
  MapPin,
  Navigation,
  Camera,
  CheckCircle2,
  Loader2,
  Search,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";

export default function InstallationListPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      // The backend 'getAllStores' automatically filters tasks assigned to the current user
      const { data } = await api.get("/stores");
      // We filter on the client side just to be safe and only show Installation relevant tasks
      const installationTasks = data.stores.filter(
        (store: Store) =>
          store.currentStatus === StoreStatus.RECCE_APPROVED ||
          store.currentStatus === StoreStatus.INSTALLATION_ASSIGNED ||
          store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ||
          store.currentStatus === StoreStatus.COMPLETED,
      );
      setStores(installationTasks);
    } catch (error) {
      toast.error("Failed to load your tasks");
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(
    (store) =>
      store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.location.city.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex h-screen justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* HEADER */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-600" /> Installation Tasks
        </h1>
        <p className="text-sm text-gray-500">
          You have {filteredStores.length} pending installations
        </p>

        {/* SEARCH */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search store or city..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LIST */}
      <div className="p-4 space-y-4">
        {filteredStores.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No installation tasks found.</p>
          </div>
        ) : (
          filteredStores.map((store) => {
            const isDone =
              store.currentStatus === StoreStatus.INSTALLATION_SUBMITTED ||
              store.currentStatus === StoreStatus.COMPLETED;

            return (
              <div
                key={store._id}
                onClick={() => router.push(`/installation/${store._id}`)}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-95 transition-transform cursor-pointer ${isDone ? "opacity-75" : ""}`}
              >
                {/* Status Strip */}
                <div
                  className={`h-1.5 w-full ${isDone ? "bg-green-500" : "bg-orange-500"}`}
                ></div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">
                        {store.storeName}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        {store.dealerCode}
                      </p>
                    </div>
                    {isDone ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        Done
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-2 text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                    <span className="line-clamp-2">
                      {store.location.address || store.location.city}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border border-gray-200">
                      <Navigation className="h-4 w-4" />
                      Navigate
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white ${isDone ? "bg-green-600" : "bg-blue-600"}`}
                    >
                      {isDone ? (
                        <>
                          {" "}
                          <CheckCircle2 className="h-4 w-4" /> View{" "}
                        </>
                      ) : (
                        <>
                          {" "}
                          <Camera className="h-4 w-4" /> Upload Proof{" "}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
