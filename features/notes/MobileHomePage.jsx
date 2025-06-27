import { h, useState, useEffect } from "../../assets/preact.esm.js"
import Sidebar from '../../commons/components/Sidebar.jsx';
import MobileNavbar from '../../commons/components/MobileNavbar.jsx';
import ApiClient from "../../commons/http/ApiClient.js";
import useSearchParams from "../../commons/components/useSearchParams.jsx";

export default function MobileHomePage() {
  const [tags, setTags] = useState([]);
  const [focusModes, setFocusModes] = useState([]);

  const searchParams = useSearchParams();
  const selectedFocusId = searchParams.get("focusId");

  useEffect(() => {
    refreshTags();
    refreshFocusModes();
  }, []);

  function refreshTags() {
    ApiClient.getTags(selectedFocusId)
      .then(newTags => {
        setTags(newTags);
      })
      .catch(error => {
        console.error('Error loading tags:', error);
      });
  }

  function refreshFocusModes() {
    ApiClient.getFocusModes()
      .then(focusModes => {
        setFocusModes(focusModes);
      })
      .catch(error => {
        console.error('Error loading focus modes:', error);
      });
  }

  return (
    <div className="mobile-home-container">
      <div className="sidebar-container">
        <Sidebar focusModes={focusModes} tags={tags} />
      </div>

      <MobileNavbar />

      <div className="note-modal-root"></div>
      <div className="modal-root"></div>
      <div className="toast-root"></div>
    </div>
  );
}