import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { formService } from "../../services/formService";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

interface ClientProgress {
  personalDetails: boolean;
  familyDetails: boolean;
  employment: boolean;
  income: boolean;
  expenses: boolean;
  assets: boolean;
  liabilities: boolean;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Check completion status for each section
        const userId = user.id;
        const progressStatus: ClientProgress = {
          personalDetails: false,
          familyDetails: false,
          employment: false,
          income: false,
          expenses: false,
          assets: false,
          liabilities: false,
        };

        // Check Personal Details
        try {
          await formService.getPersonalDetailsById(userId);
          progressStatus.personalDetails = true;
        } catch (error) {
          console.log("Personal details not found");
        }

        // Check Family Details
        try {
          const familyDetails = await formService.getFamilyMemberById(userId);
          console.log("Family details:", familyDetails);
          progressStatus.familyDetails = familyDetails ? true : false;
        } catch (error) {
          console.log("Family details not found");
        }

        // Check Employment
        try {
          const employment = await formService.getEmploymentById(userId);
          progressStatus.employment = employment ? true : false;
        } catch (error) {
          console.log("Employment details not found");
        }

        // Check Income
        try {
          const income = await formService.getIncomeById(userId);
          progressStatus.income = income ? true : false;
        } catch (error) {
          console.log("Income details not found");
        }

        // Check Expenses
        try {
          const expenses = await formService.getExpensesByUserId(userId);
          progressStatus.expenses = expenses ? true : false;
        } catch (error) {
          console.log("Expenses details not found");
        }

        // Check Assets
        try {
          const assets = await formService.getAssetById(userId);
          progressStatus.assets = assets ? true : false;
        } catch (error) {
          console.log("Assets details not found");
        }

        // Check Liabilities
        try {
          const liabilities = await formService.getLiabilityById(userId);
          progressStatus.liabilities = liabilities ? true : false;
        } catch (error) {
          console.log("Liabilities details not found");
        }

        setProgress(progressStatus);
      } catch (error) {
        console.error("Failed to load progress:", error);
        // Set all to false if there's an error
        setProgress({
          personalDetails: false,
          familyDetails: false,
          employment: false,
          income: false,
          expenses: false,
          assets: false,
          liabilities: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user?.id, user?.updated_at]);

  // Refresh progress when component becomes visible (e.g., returning from forms)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        // Reload progress when tab becomes visible
        const loadProgress = async () => {
          try {
            const userId = user.id;
            const progressStatus: ClientProgress = {
              personalDetails: false,
              familyDetails: false,
              employment: false,
              income: false,
              expenses: false,
              assets: false,
              liabilities: false,
            };

            // Check Personal Details
            try {
              await formService.getPersonalDetailsById(userId);
              progressStatus.personalDetails = true;
            } catch (error) {
              console.log("Personal details not found");
            }

            // Check Family Details
            try {
              const familyDetails =
                await formService.getFamilyMemberById(userId);
              progressStatus.familyDetails = familyDetails ? true : false;
            } catch (error) {
              console.log("Family details not found");
            }
            // Check Employment
            try {
              const employment = await formService.getEmploymentById(userId);
              progressStatus.employment = employment ? true : false;
            } catch (error) {
              console.log("Employment details not found");
            }

            // Check Income
            try {
              const income = await formService.getIncomeById(userId);
              progressStatus.income = income ? true : false;
            } catch (error) {
              console.log("Income details not found");
            }

            // Check Expenses
            try {
              const expenses = await formService.getExpensesByUserId(userId);
              progressStatus.expenses = expenses ? true : false;
            } catch (error) {
              console.log("Expenses details not found");
            }

            // Check Assets
            try {
              const assets = await formService.getAssetById(userId);
              progressStatus.assets = assets ? true : false;
            } catch (error) {
              console.log("Assets details not found");
            }

            // Check Liabilities
            try {
              const liabilities = await formService.getLiabilityById(userId);
              progressStatus.liabilities = liabilities ? true : false;
            } catch (error) {
              console.log("Liabilities details not found");
            }

            setProgress(progressStatus);
          } catch (error) {
            console.error("Failed to refresh progress:", error);
          }
        };

        loadProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner fullScreen text={t("common.loading")} />;
  }

  const completedCount = progress
    ? Object.values(progress).filter(Boolean).length
    : 0;
  const totalForms = 7; // Total number of form sections
  const completionPercentage = Math.round((completedCount / totalForms) * 100);

  const formSections = [
    {
      title: t("dashboard.client.personalInfo"),
      completed: progress?.personalDetails || false,
      link: "/dashboard/forms/personal-details",
      icon: "👤",
    },
    {
      title: t("dashboard.client.familyInfo"),
      completed: progress?.familyDetails || false,
      link: "/dashboard/forms/family-details",
      icon: "👨‍👩‍👧‍👦",
    },
    {
      title: t("dashboard.client.employmentDetails"),
      completed: progress?.employment || false,
      link: "/dashboard/forms/employment",
      icon: "💼",
    },
    {
      title: t("dashboard.client.incomeDetails"),
      completed: progress?.income || false,
      link: "/dashboard/forms/income",
      icon: "💰",
    },
    {
      title: t("dashboard.client.monthlyExpenses"),
      completed: progress?.expenses || false,
      link: "/dashboard/forms/expenses",
      icon: "📊",
    },
    {
      title: t("dashboard.client.assetsInvestments"),
      completed: progress?.assets || false,
      link: "/dashboard/forms/assets",
      icon: "🏦",
    },
    {
      title: t("dashboard.client.debtsLiabilities"),
      completed: progress?.liabilities || false,
      link: "/dashboard/forms/liabilities",
      icon: "📋",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("dashboard.client.title")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("dashboard.client.welcome", {
              name: user?.first_name || "Client",
            })}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("dashboard.client.profileCompletion")}
          </h2>
          <span
            className="text-2xl font-bold"
            style={{ color: colors.primary }}
          >
            {completionPercentage}%
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: colors.primary,
            }}
          ></div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount} of {totalForms} sections completed.
          {completedCount < totalForms &&
            ` ${t("dashboard.client.completeProfileDesc")}`}
        </p>
      </div>

      {/* Form Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formSections.map((section, index) => (
          <Link
            key={index}
            to={section.link}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 p-6 relative"
          >
            {section.completed && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                style={{
                  backgroundColor: section.completed
                    ? "#10B981"
                    : colors.primary,
                }}
              >
                {section.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {section.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {section.completed ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {t("common.completed")}
                    </span>
                  ) : (
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.primary }}
                    >
                      {t("common.getStarted")}
                    </span>
                  )}
                  <svg
                    className="w-4 h-4"
                    style={{
                      color: section.completed ? "#10B981" : colors.primary,
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t("dashboard.client.nextSteps")}
        </h2>

        {completionPercentage < 100 ? (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              {t("dashboard.client.completeRemaining")}
            </p>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{t("dashboard.client.unlockPersonalAnalysis")}</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{t("dashboard.client.unlockCustomizedCoaching")}</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{t("dashboard.client.unlockGoalTracking")}</span>
              </li>
            </ul>

            <div className="mt-4">
              {/* Find next incomplete section */}
              {(() => {
                const nextSection = formSections.find(
                  (section) => !section.completed,
                );
                return nextSection ? (
                  <Link to={nextSection.link}>
                    <Button>
                      {t("dashboard.client.continueWith", {
                        section: nextSection.title,
                      })}
                    </Button>
                  </Link>
                ) : null;
              })()}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("dashboard.client.profileComplete")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t("dashboard.client.completeProfileMessage")}
            </p>
            {/* <Button variant="outline">
              {t('dashboard.client.viewFinancialSummary')}
            </Button> */}
          </div>
        )}
      </div>
    </div>
  );
}
