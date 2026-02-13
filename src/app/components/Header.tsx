import React, { useState, useEffect } from "react";
import { User, ChevronDown, RotateCcw } from "lucide-react";
import { getTab1Data } from "../../services/googleSheetsService";

export function Header({
  title,
  onFilterChange,
}: {
  title: string;
  onFilterChange: (filters: { year: string; project: string }) => void;
}) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [projects, setProjects] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const tab1Data = await getTab1Data();
        const uniqueProjects = new Set(
          tab1Data.rows
            .map((row) => String(row["Project Code"]))
            .filter((project) => project && project.trim() !== ""),
        );
        const projectList = Array.from(uniqueProjects) as string[];
        setAllProjects(projectList);
        setProjects(projectList);

        // Get all available years
        const uniqueYears = new Set(
          tab1Data.rows
            .map((row) => {
              const dateStr = row["DATE"];
              if (dateStr) {
                return new Date(dateStr).getFullYear().toString();
              }
              return null;
            })
            .filter((year) => year !== null),
        );
        const yearList = Array.from(uniqueYears) as string[];
        setAvailableYears(yearList.sort((a, b) => parseInt(b) - parseInt(a)));
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAllProjects([]);
        setProjects([]);
        setAvailableYears([]);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const filterProjectsByYear = async () => {
      try {
        const tab1Data = await getTab1Data();
        let filteredRows = tab1Data.rows;

        // Filter by year if selected
        if (selectedYear !== "all") {
          filteredRows = filteredRows.filter((row) => {
            const dateStr = row["DATE"];
            if (dateStr) {
              const year = new Date(dateStr).getFullYear().toString();
              return year === selectedYear;
            }
            return false;
          });
        }

        // Get unique projects from filtered data
        const uniqueProjects = new Set(
          filteredRows
            .map((row) => String(row["Project Code"]))
            .filter((project) => project && project.trim() !== ""),
        );
        const projectList = Array.from(uniqueProjects) as string[];
        setProjects(projectList);

        // Reset selected project if it's not in filtered list
        if (
          selectedProject !== "all" &&
          !projectList.includes(selectedProject)
        ) {
          setSelectedProject("all");
          onFilterChange({ year: selectedYear, project: "all" });
        }
      } catch (error) {
        console.error("Error filtering projects by year:", error);
        setProjects([]);
      }
    };

    filterProjectsByYear();
  }, [selectedYear]);

  useEffect(() => {
    const filterYearsByProject = async () => {
      try {
        const tab1Data = await getTab1Data();
        let filteredRows = tab1Data.rows;

        // Filter by project if selected
        if (selectedProject !== "all") {
          filteredRows = filteredRows.filter(
            (row) => String(row["Project Code"]) === selectedProject,
          );
        }

        // Get unique years from filtered data
        const uniqueYears = new Set(
          filteredRows
            .map((row) => {
              const dateStr = row["DATE"];
              if (dateStr) {
                return new Date(dateStr).getFullYear().toString();
              }
              return null;
            })
            .filter((year) => year !== null),
        );
        const yearList = Array.from(uniqueYears) as string[];
        setAvailableYears(yearList.sort((a, b) => parseInt(b) - parseInt(a)));

        // Reset selected year if it's not in filtered list
        if (selectedYear !== "all" && !yearList.includes(selectedYear)) {
          setSelectedYear("all");
          onFilterChange({ year: "all", project: selectedProject });
        }
      } catch (error) {
        console.error("Error filtering years by project:", error);
        setAvailableYears([]);
      }
    };

    filterYearsByProject();
  }, [selectedProject]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    onFilterChange({ year, project: selectedProject });
  };

  const handleProjectChange = (project: string) => {
    setSelectedProject(project);
    onFilterChange({ year: selectedYear, project });
  };

  const handleClearFilters = () => {
    setSelectedYear("all");
    setSelectedProject("all");
    onFilterChange({ year: "all", project: "all" });
  };

  return (
    <div className="h-auto bg-slate-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-white tracking-wide">
          {title}
        </h2>

        {/* Filter Section - Top Right */}
        <div className="flex gap-3 items-center">
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {/* Year */}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {/* Project */}
            </label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm bg-slate-900 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              title="Clear Filter"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
