import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Upload } from "lucide-react";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/common/Modal";
import { resourceService } from "../../services/resourceService";
import { useAuth } from "../../hooks/useAuth";

export const TeacherResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    type: "pdf",
    url: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const lessonId = searchParams.get("lesson");

  const fetchResources = async () => {
    try {
      setLoading(true);
      if (lessonId) {
        const res = await resourceService.get(`/resources?lesson=${lessonId}`);
        setResources(res);
      } else {
        const lessonsRes = await resourceService.get("/lessons");
        setLessons(lessonsRes);
        if (lessonsRes.length > 0) {
          const res = await resourceService.get(`/resources?lesson=${lessonsRes[0]._id}`);
          setResources(res);
          setSelectedLesson(lessonsRes[0]._id);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des ressources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleLessonChange = async (lId) => {
    try {
      setSelectedLesson(lId);
      const res = await resourceService.get(`/resources?lesson=${lId}`);
      setResources(res);
      setFormData({ title: "", type: "pdf", url: "" });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      setUploadProgress(selectedFile ? 0 : 100);
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title);
      formDataObj.append("type", formData.type);
      formDataObj.append("lesson", selectedLesson || lessonId);

      if (selectedFile) {
        formDataObj.append("file", selectedFile);
      } else if (formData.url) {
        formDataObj.append("url", formData.url);
      }

      await resourceService.postForm("/resources", formDataObj, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setShowModal(false);
      setFormData({ title: "", type: "pdf", url: "" });
      setSelectedFile(null);
      setUploadProgress(0);
      fetchResources();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur: " + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette ressource ?")) return;
    try {
      await resourceService.delete(`/resources/${id}`);
      fetchResources();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const getResourceIcon = (type) => {
    const icons = {
      pdf: "📄",
      document: "📋",
      image: "🖼️",
      presentation: "📊",
      youtube: "🎥",
      external: "🔗"
    };
    return icons[type] || "📎";
  };

  const columns = [
    {
      key: "title",
      label: "Ressource",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{getResourceIcon(row.type)}</span>
          <span className="font-medium">{row.title}</span>
        </div>
      )
    },
    { key: "type", label: "Type" },
    {
      key: "path",
      label: "URL / Chemin",
      render: (row) => (
        <a href={row.url || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm truncate max-w-xs">
          {row.filePath || row.url || "N/A"}
        </a>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              Ouvrir
            </a>
          )}
          <button
            onClick={() => handleDelete(row._id)}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Supprimer
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-6 text-center">Chargement...</div>;

  const activeLesson = lessons.find((l) => l._id === (selectedLesson || lessonId));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ressources Pédagogiques</h1>
        <p className="text-gray-600">Gérez vos documents, PDFs et supports de cours</p>
      </div>

      {!lessonId && lessons.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un chapitre:</label>
          <select
            value={selectedLesson}
            onChange={(e) => handleLessonChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {lessons.map((l) => (
              <option key={l._id} value={l._id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total ressources" value={resources.length} color="blue" />
        <StatCard label="Chapitre sélectionné" value={activeLesson?.title || "N/A"} color="cyan" />
        <StatCard label="Types variés" value={new Set(resources.map((r) => r.type)).size} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Ressources du chapitre</h2>
          <button
            onClick={() => {
              setFormData({ title: "", type: "pdf", url: "" });
              setSelectedFile(null);
              setUploadProgress(0);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition"
          >
            + Ajouter ressource
          </button>
        </div>
        <DataTable columns={columns} rows={resources} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Ajouter une ressource">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de ressource</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="document">Document (Word/ODT)</option>
              <option value="image">Image</option>
              <option value="presentation">Présentation (PPT/ODP)</option>
              <option value="youtube">YouTube</option>
              <option value="external">Lien externe</option>
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
            <input
              type="file"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setFormData({ ...formData, url: "" });
                  setUploadProgress(0);
                }
              }}
              className="hidden"
              id="fileInput"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.odp"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              {selectedFile ? (
                <div className="text-green-600 font-medium">✓ {selectedFile.name}</div>
              ) : (
                <div className="text-gray-600">Cliquez ou déposez un fichier ici</div>
              )}
            </label>
          </div>

          {uploading && selectedFile ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-blue-900">
                <span className="inline-flex items-center gap-2">
                  <Upload size={16} />
                  Upload en cours
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          {formData.type.includes("youtube") || formData.type === "external" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value });
                  setUploadProgress(0);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
                required={formData.type.includes("youtube") || formData.type === "external"}
              />
            </div>
          ) : null}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {uploading ? "Upload..." : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setUploadProgress(0);
              }}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
