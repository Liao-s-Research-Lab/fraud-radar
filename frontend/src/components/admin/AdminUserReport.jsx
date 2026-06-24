import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import EditIcon from "@mui/icons-material/Edit"; 
import CloseIcon from "@mui/icons-material/Close"; 
import { visuallyHidden } from "@mui/utils";
import { db } from "../../firebase";
import { collection,getDocs, addDoc, deleteDoc, updateDoc, doc, query, getDoc, serverTimestamp,onSnapshot,where,orderBy,limit } 
from "firebase/firestore"; 
import "./AdminUserReport.css";
import { Modal } from "react-bootstrap";
import TextField from "@mui/material/TextField"; 


const headCells = [
  {
    id: "Report",
    numeric: false,
    disablePadding: false,
    label: "Report",
    sortable: false,
  },
  {
    id: "Source",
    numeric: false,
    disablePadding: false,
    label: "Source",
    sortable: false,
  },
  {
    id: "AddNote",
    numeric: false,
    disablePadding: false,
    label: "AddNote",
    sortable: false,
  },
  {
    id: "FraudResult",
    numeric: true,
    disablePadding: false,
    label: "FraudResult",
    sortable: false,
  },
  {
    id: "MatchKeyword",
    numeric: true,
    disablePadding: false,
    label: "MatchKeyword",
    sortable: false,
  },
  {
    id: "MatchType",
    numeric: true,
    disablePadding: false,
    label: "MatchType",
    sortable: false,
  },
  {
    id: "FraudRate",
    numeric: true,
    disablePadding: false,
    label: "FraudRate",
    sortable: true,
  },
  {
    id: "ShortVideo",
    numeric: true,
    disablePadding: false,
    label: "ShortVideo",
    sortable: true,
  },
];

const getComparator = (order, orderBy) => {
  return order === "desc"
    ? (a, b) => {
        const aValue =
          orderBy === "FraudRate" ? Number(a[orderBy]) : a[orderBy];
        const bValue =
          orderBy === "FraudRate" ? Number(b[orderBy]) : b[orderBy];
        return bValue < aValue ? -1 : 1;
      }
    : (a, b) => {
        const aValue =
          orderBy === "FraudRate" ? Number(a[orderBy]) : a[orderBy];
        const bValue =
          orderBy === "FraudRate" ? Number(b[orderBy]) : b[orderBy];
        return aValue < bValue ? -1 : 1;
      };
};

function EnhancedTableHead(props) {
  const {
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property) => (event) => {
    // 只允許 FraudRate 進行排序
    if (property === "FraudRate") {
      onRequestSort(event, property);
    }
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            inputProps={{
              "aria-label": "select all desserts",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
            className="MuiTableCell-root MuiTableCell-head MuiTableCell-alignRight MuiTableCell-sizeMedium css-to33az-MuiTableCell-root"
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
              disabled={!headCell.sortable}
              className={`${orderBy === headCell.id 
                ? "MuiButtonBase-root MuiTableSortLabel-root Mui-active MuiTableSortLabel-directionDesc css-7x9vt0-MuiButtonBase-root-MuiTableSortLabel-root" 
                : "MuiButtonBase-root MuiTableSortLabel-root MuiTableSortLabel-directionAsc css-7x9vt0-MuiButtonBase-root-MuiTableSortLabel-root"} head-cell-label`}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function EnhancedTableToolbar(props) {
  const { numSelected, openUpdateModal, openDeleteModal, handleCheckFraud, openEditModal } = props;

  return (
    <>
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        },
      ]} className="toolbar"
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: "1 1 100%" }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          已選擇 {numSelected} 筆
        </Typography>
      ) : (
        <Typography
          sx={{ flex: "1 1 100%" }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
        </Typography>
      )}
      {numSelected > 0 ? (
        <>
          <Tooltip title="詐騙檢測 Fraud Check">
            <IconButton onClick={handleCheckFraud} className="icon-white">
              <FactCheckIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯 Edit">
            <IconButton onClick={openEditModal} className="icon-white">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="更新 Update">
            <IconButton onClick={openUpdateModal} className="icon-white">
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除 Delete">
            <IconButton onClick={openDeleteModal} className="icon-white">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ) : null}
    </Toolbar>
    </>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  openUpdateModal: PropTypes.func.isRequired,
  openDeleteModal: PropTypes.func.isRequired,
  handleCheckFraud: PropTypes.func.isRequired,
  openEditModal: PropTypes.func.isRequired,
};

export default function AdminPreview() {
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("FraudRate");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [matchedData, setMatchedData] = useState([]);
  const [unmatchedData, setUnmatchedData] = useState([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFraudCheckModalOpen, setIsFraudCheckModalOpen] = useState(false);
  const [fraudCheckResult, setFraudCheckResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [editData, setEditData] = useState({
    Report: "",
    Source: "",
    AddNote: "",
    FraudResult: "",
    MatchKeyword: "",
    MatchType: "",
    FraudRate: "",
    ShortVideo:""
  });

  // 定義TextField共用樣式
  const textFieldProps = {
    InputProps: {
      className: "text-field-font"
    },
    InputLabelProps: {
      className: "text-field-label",
      shrink: true
    }
  };

  const textFieldHelperProps = {
    FormHelperTextProps: {
      className: "text-field-helper"
    }
  };

  const openUpdateModal = () => setIsUpdateModalOpen(true);
  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const openFraudCheckModal = () => setIsFraudCheckModalOpen(true);
  const openEditModal = () => {
    if (selected.length > 0) {
      const selectedRow = rows.find(row => row.id === selected[0]);
      if (selectedRow) {
        setEditData({
          Report: selectedRow.Report || "",
          Source: selectedRow.Source || "",
          AddNote: selectedRow.AddNote || "",
          FraudResult: selectedRow.FraudResult || "",
          MatchKeyword: selectedRow.MatchKeyword || "",
          MatchType: selectedRow.MatchType || "",
          FraudRate: selectedRow.FraudRate || "",
          ShortVideo:selectedRow.ShortVideo|| ""
        });
        setIsEditModalOpen(true);
      }
    }
  };

  const closeReturnModal = () => {
    setIsUpdateModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsFraudCheckModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleCloseCheck = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsLoading(false);
    closeReturnModal();
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      if (selected.length === 0) {
        console.error("未選擇任何資料");
        return;
      }

      const selectedId = selected[0];
      const reportRef = doc(db, "Report", selectedId);
      const updateData = {
        Report: editData.Report,
        Source: editData.Source,
        AddNote: editData.AddNote,
        ShortVideo:editData.ShortVideo
      };

      // 如果有PythonResult相關資料，則更新它們
      if (editData.FraudResult || editData.FraudRate || editData.MatchKeyword || editData.MatchType) {
        // 將MatchKeyword和MatchType轉換為Match陣列
        const matchKeywords = editData.MatchKeyword.split(',').map(k => k.trim()).filter(k => k);
        const matchTypes = editData.MatchType.split(',').map(t => t.trim()).filter(t => t);
        
        const maxLength = Math.max(matchKeywords.length, matchTypes.length);
        const matches = [];
        
        for (let i = 0; i < maxLength; i++) {
          matches.push({
            MatchKeyword: matchKeywords[i] || "",
            MatchType: matchTypes[i] || "未知"
          });
        }

        updateData.PythonResult = {
          FraudResult: editData.FraudResult,
          FraudRate: parseFloat(editData.FraudRate) || 0,
          Match: matches
        };
      }

      // Add LastUpdated timestamp
      updateData.LastUpdated = serverTimestamp();

      await updateDoc(reportRef, updateData);
      
      // Note: We don't need to update the rows manually anymore since the real-time listener will do it
      console.log("更新成功");
      closeReturnModal();
    } catch (error) {
      console.error("更新失敗:", error);
      alert(`更新失敗: ${error.message}`);
    }
  };

  // Function to handle fraud check
  const handleCheckFraud = async () => {
    try {
      const controller = new AbortController();
      setAbortController(controller);

      openFraudCheckModal();
      setIsLoading(true);

      const selectedRows = rows.filter(row => selected.includes(row.id));
      if (selectedRows.length === 0) {
        console.error("No rows selected");
        setIsLoading(false);
        closeReturnModal();
        return;
      }

      for (const row of selectedRows) {
        let response;
        let data;
      
        // 檢查是否是網址
        if (row.Report.match(/^(https?:\/\/|www\.)/i)) {
          response = await fetch('/api/fetch-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: row.Report, from: 'Report' }),
          });
          
          data = await response.json();

        // 檢查是否是圖片檔案
        } else if (row.Report.match(/\.(jpe?g|png|webp|txt|pdf|docx?)$/i)) {
          const docRef = doc(db, "Report", row.id);  
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            data = docSnap.data().Data;
            console.error(`文檔`,data);
          } else {
            console.error(`找不到 ID 為 ${row.id} 的文檔`);
            data = { error: '找不到對應的資料' };
          }
        } else {
          // 其他情況：假設是純文字，發送給後端處理
          response = await fetch('/api/fetch-content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: row.Report , from: 'Report' }),
          });
          data = await response.json();
        }
        
        console.log(`row id ${row.id} 檢測結果:`, data);

        if (data.pythonResult) {
          try {
            const reportRef = doc(db, "Report", row.id);
            const pythonResult = {
              FraudResult: data.pythonResult.FraudResult,
              FraudRate: parseFloat(data.pythonResult.FraudRate),
              Match: data.pythonResult.Match?.map(mk => ({
                MatchKeyword: mk.keyword || mk.MatchKeyword,
                MatchType: mk.type || mk.MatchType || "未知"
              })) || [],
              Emotion: data.pythonResult.Emotion || "neutral"
            };

            await updateDoc(reportRef, {
              PythonResult: pythonResult,
              LastUpdated: serverTimestamp()
            });

            console.log(`✅ 成功更新 Report 文檔 ${row.id}`);
          } catch (updateError) {
            console.error(`❌ 更新 Report 文檔 ${row.id} 時出錯:`, updateError);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error("Error during fraud check:", error);
        alert("詐騙檢測失敗: " + error.message);
      }
    } finally {
      setIsLoading(false);
      closeReturnModal();
      setAbortController(null);
    }
  };

  // Modified useEffect to use real-time listener instead of one-time fetch
  useEffect(() => {
    // Create a new listener
    const reportCollection = collection(db, "Report");
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(reportCollection, (snapshot) => {
      const reportData = [];
      
      snapshot.forEach((reportDoc) => {
        const data = reportDoc.data();
        
        let fraudResult = "";
        let matchKeywords = [];
        let matchTypes = [];
        let fraudRate = 0;
        let matches = [];
        let detectionType = data.DetectionType || null;
        let ShortVideo =[];
        
        if (data.PythonResult) {
          fraudResult = data.PythonResult.FraudResult || "";
          fraudRate = data.PythonResult.FraudRate || 0;
          
          if (data.PythonResult.Match && Array.isArray(data.PythonResult.Match)) {
            matches = data.PythonResult.Match;
            matchKeywords = data.PythonResult.Match.map(m => m.MatchKeyword || "");
            matchTypes = data.PythonResult.Match.map(m => m.MatchType || "");
          }
        }
        
        // 判斷檔案類型並設置圖標
        let fileType = "";
        let fileIcon = "";
        
        if (detectionType === 1 || data.Report?.match(/^(https?:\/\/|www\.)/i)) {
          fileType = "URL";
          // fileIcon = "🔗";
        } else if (detectionType === 3 || data.Report?.match(/\.(txt|pdf|docx?)$/i)) {
          fileType = "檔案";
          // fileIcon = "📄";
        } else if (detectionType === 4 || data.Report?.match(/\.(jpe?g|png|gif|bmp|webp)$/i)) {
          fileType = "圖片";
          // fileIcon = "🖼️";
        } else {
          fileType = "文字";
          // fileIcon = "📝";
        }
        
        reportData.push({
          id: reportDoc.id,
          Report: data.Report || "",
          Source: data.Source || "",
          AddNote: data.AddNote || "",
          FraudResult: fraudResult,
          MatchKeyword: matchKeywords.join(", "),
          MatchType: matchTypes.join(", "),
          FraudRate: fraudRate,
          Match: matches,
          DetectionType: detectionType,
          FileType: fileType,
          FileIcon: fileIcon,
          LastUpdated: data.LastUpdated ,
          ShortVideo:data.ShortVideo|| "",
        });
      });
      
      console.log("Real-time update: Fetched Report data:", reportData);
      
      // When receiving real-time updates, maintain selection if possible
      setRows(prevRows => {
        // Keep track of selected rows
        const previouslySelectedIds = selected;
        
        // If we have selected rows and they still exist in the new data, keep them selected
        if (previouslySelectedIds.length > 0) {
          const stillExists = previouslySelectedIds.filter(id => 
            reportData.some(row => row.id === id)
          );
          
          if (stillExists.length !== previouslySelectedIds.length) {
            // Some selected rows were deleted, update selection
            setSelected(stillExists);
          }
        }
        
        return reportData;
      });
    }, (error) => {
      console.error("Error in real-time listener:", error);
    });
    
    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);  // Empty dependency array means this runs once on mount

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    console.log(`Order: ${isAsc ? "desc" : "asc"}, Order By: ${property}`);
  };

  const handleClick = (event, id) => {
    if (selected.indexOf(id) !== -1) {
      setSelected([]);
    } else {
      setSelected([id]);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = 
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = useMemo(
    () => 
      [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, rows]
  );

  const updateStatistics = async () => {
    const selectedIds = rows.filter((row) => selected.includes(row.id));
    console.log("選擇的行", selectedIds);
    const ids = selectedIds.map(item => item.id);
    try {
      // 確認是否有選擇的 ID
      if (!selectedIds || selectedIds.length === 0) {
        console.error("未選擇任何資料");
        return;
      }
      
      const ids = selectedIds.map(item => item.id);
      // 1. 讀取 Outcome 集合中符合 selectedIds 的文檔
      const outcomeCollectionRef = collection(db, 'Outcome');
      const selectedDocs = await Promise.all(
        ids.map(async (id) => {
          console.log(id)
          console.log("當前處理的 ID:", id, "類型:", typeof id);

          const docRef = doc(outcomeCollectionRef, id);
          const docSnapshot = await getDoc(docRef);
          return docSnapshot.exists() ? docSnapshot : null;
        })
      );
      // 篩選有效的文檔
      const validDocs = selectedDocs.filter((doc) => doc !== null);
      const newTotalDataCount = validDocs.length; // 只計算選中的有效文檔

      // 2. 讀取 Statistics 表中的 finalStatistics 文檔
      const statisticsRef = doc(db, 'Statistics', 'finalStatistics');
      const docSnapshot = await getDoc(statisticsRef);

      // 3. 獲取現有的 totalDataCount 和 finalAccuracy
      let currentTotalDataCount = 0;
      let currentFinalAccuracy = 0;
      if (docSnapshot.exists()) {
        currentTotalDataCount = docSnapshot.data().totalDataCount || 0; 
        currentFinalAccuracy = docSnapshot.data().finalAccuracy || 0; 
      }

      // 4. 計算選中文檔的總準確度
      let totalCalculatedAccuracy = 0;
      let recordCount = 0;
      validDocs.forEach((doc) => {
        const data = doc.data();
        const fraudRate = data.PythonResult?.FraudRate;

        if (fraudRate !== undefined) {
          let adjustedFraudRate;
          if ((fraudRate >= 50 && fraudRate <= 75) || (fraudRate >= 0 && fraudRate <= 25)) {
            adjustedFraudRate = 100 - fraudRate; // 調整後的 fraudRate
          } else {
            adjustedFraudRate = fraudRate;
          }
          const weightedAccuracy = adjustedFraudRate; // 不再使用星星評分
          totalCalculatedAccuracy += weightedAccuracy;
          recordCount++;

          // 調試輸出每筆資料的計算過程
          console.log(`Doc ID: ${doc.id}, FraudRate: ${fraudRate}`);
          console.log(`Adjusted FraudRate: ${adjustedFraudRate}`);
          console.log(`Weighted Accuracy for this doc: ${weightedAccuracy}`);
        }
      });
      // 5. 更新 totalDataCount，將舊的值和新的值加起來
      const updatedTotalDataCount = currentTotalDataCount + newTotalDataCount;
      // 計算新的 finalAccuracy (加權總準確度)
      const newFinalAccuracy = (currentFinalAccuracy * currentTotalDataCount + totalCalculatedAccuracy) / updatedTotalDataCount;

      // 6. 更新 Statistics 表中的 finalStatistics 文檔
      await updateDoc(statisticsRef, {
        totalDataCount: updatedTotalDataCount,
        finalAccuracy: newFinalAccuracy,
      });

      // 調試輸出最終結果
      console.log("當前 totalDataCount:", currentTotalDataCount);
      console.log("新的 totalDataCount:", newTotalDataCount);
      console.log("更新後 totalDataCount:", updatedTotalDataCount);
      console.log("當前 finalAccuracy:", currentFinalAccuracy);
      console.log("計算的總準確度:", totalCalculatedAccuracy);
      console.log("新的 finalAccuracy:", newFinalAccuracy);
    } catch (error) {
      console.error("統計未更新: ", error);
    }
  };

  /* 統計各類型出現次數，和最熱門詐騙類型*/
  const updatetopType = async () => {
    const selectedIds = rows.filter((row) => selected.includes(row.id));
    console.log("選擇的行", selectedIds);
    const matchTypeCount = selectedIds.flatMap(row => 
      row.Match.map(matchItem => matchItem.MatchType)
    );
    console.log("提取的 MatchType:", matchTypeCount);
    try {
      // 1. 讀取 Outcome 集合並初始化 MatchType 計數
      const outcomeCollection = await getDocs(collection(db, "Outcome"));

      // 2. 遍歷 Outcome 集合，提取 MatchType 並計算頻率
      outcomeCollection.forEach((doc) => {
        const data = doc.data();
        const matches = data.PythonResult?.Match || []; // 獲取 Match 陣列
        matches.forEach((match) => {
          const matchType = match.MatchType?.trim(); // 確保去除多餘空格
          if (matchType) {
            matchTypeCount[matchType] = (matchTypeCount[matchType] || 0) + 1;
          }
        });
      });

      // 3. 讀取 Statistics 集合
      const statisticsCollection = await getDocs(collection(db, "Statistics"));

      // 儲存最高頻率及對應類型
      let maxFrequency = 0;
      let maxFrequencyTypes = []; // 儲存所有最大頻率類型

      // 4. 更新 Statistics 中的 Frequency 並找到最大值
      for (const statDoc of statisticsCollection.docs) {
        const data = statDoc.data();
        const type = data.Type?.trim(); // 確保去除多餘空格
        console.log(`檢查文檔 ${statDoc.id} 的 Type 值: ${type}`);

        if (matchTypeCount[type]) {
          console.log(`找到匹配的 Type: ${type}`);
          // 累計更新 Frequency 值
          const updatedFrequency = (data.Frequency || 0) + matchTypeCount[type];
          const statisticsRef = doc(db, "Statistics", statDoc.id); // 獲取文檔引用
          await updateDoc(statisticsRef, { Frequency: updatedFrequency }); // 更新 Frequency
          console.log(`更新文檔 ${statDoc.id} 的 Frequency 成功，新的值為: ${updatedFrequency}`);

          // 更新最大頻率類型列表
          if (updatedFrequency > maxFrequency) {
            maxFrequency = updatedFrequency;
            maxFrequencyTypes = [type]; // 重置為新最大值的類型
          } else if (updatedFrequency === maxFrequency) {
            maxFrequencyTypes.push(type); // 添加到最大值類型列表
          }
        } else {
          console.warn(`Type: ${type} 未在 MatchType 中找到對應項`);
        }
      }
      
      console.log("統計類型頻率更新完成！");
      // 5. 返回所有最大頻率的類型
      if (maxFrequencyTypes.length > 0) {
        console.log(`最大頻率類型為: ${maxFrequencyTypes.join(", ")}, 頻率為: ${maxFrequency}`);
        return maxFrequencyTypes; // 返回最大頻率類型的陣列
      } else {
        console.warn("未找到任何匹配的類型！");
        return [];
      }
    } catch (error) {
      console.error("更新統計類型失敗: ", error);
      return [];
    }
  };

const uploadShortVideoIfNotExists = async (videoURL) => {
  if (!videoURL) {
    console.warn("⚠️ videoURL 為空，跳過");
    return;
  }

  try {
    const trimmedURL = videoURL.trim();
    console.log("處理影片 URL:", trimmedURL);

    const q = query(
      collection(db, "ShortVideo"),
      where("VideoURL", "==", trimmedURL)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log(`影片已存在，略過上傳: ${trimmedURL}`);
      return;
    }

    let platform = "未知";
    if (trimmedURL.includes("instagram.com")) {
      platform = "instagram";
    } else if (trimmedURL.includes("tiktok.com")) {
      platform = "tikTok";
    } else if (trimmedURL.includes("youtube.com") || trimmedURL.includes("youtu.be")) {
      platform = "youTube";
    }

    const newVideo = {
      VideoURL: trimmedURL,
      Platform: platform,
      Timestamp: serverTimestamp(),
    };

    console.log("寫入 ShortVideo 資料:", newVideo);

    await addDoc(collection(db, "ShortVideo"), newVideo);

    console.log(`✅ 成功新增影片，平臺: ${platform}`);
  } catch (error) {
    console.error("❌ 上傳 ShortVideo 發生錯誤: ", error.message);
  }
};



  const handleUpdate = async () => {
    try {
      await updateStatistics();
      await updatetopType();

      const fraudDefineSnapshot = await getDocs(collection(db, "FraudDefine"));
      const fraudDefineKeywords = fraudDefineSnapshot.docs
        .map((doc) => (doc.data().Keyword || "").trim())
        .filter((k) => k);

      const matched = [];
      const unmatched = [];

      const selectedRows = rows.filter((row) => selected.includes(row.id));

      for (const row of selectedRows) {
        try {
          const reportRef = doc(db, "Report", row.id);
          const reportDoc = await getDoc(reportRef);

          if (!reportDoc.exists()) {
            console.error(`Report 文檔不存在: ${row.id}`);
            continue;
          }

          const reportData = reportDoc.data();
          const videoURL = reportData.ShortVideo;

          // ✅ 避免重複上傳影片
          await uploadShortVideoIfNotExists(videoURL);

          // ✅ 比對關鍵字
          if (Array.isArray(row.Match)) {
            const matchKeywords = row.Match.map((item) => item.MatchKeyword?.trim());
            console.log("FraudDefine Keywords:", fraudDefineKeywords);
            console.log("row.Match Keywords:", matchKeywords);

            const same = row.Match.filter((matchItem) =>
              fraudDefineKeywords.includes(matchItem.MatchKeyword?.trim())
            );
            if (same.length > 0) {
              matched.push({ ...row, Match: same });
            }

            const newKeywords = row.Match.filter((matchItem) =>
              !fraudDefineKeywords.includes(matchItem.MatchKeyword?.trim())
            );
            if (newKeywords.length > 0) {
              unmatched.push({ ...row, Match: newKeywords });

              for (const newItem of newKeywords) {
                await addDoc(collection(db, "FraudDefine"), {
                  Keyword: newItem.MatchKeyword,
                  Type: newItem.MatchType || "未知",
                  Result: row.FraudResult === "詐騙" ? true : false,
                });
                console.log(`成功將關鍵字 ${newItem.MatchKeyword} 添加到 FraudDefine`);
              }
            }
          } else {
            console.warn(`row.Match 資料格式不正確:`, row.Match);
          }

          // ✅ 刪除處理完成的 Report
          await deleteDoc(reportRef);
          console.log(`成功刪除 Report ID: ${row.id}`);
        } catch (error) {
          console.error(`處理 Report ${row.id} 時發生錯誤:`, error);
        }
      }

      console.log("已重複關鍵字:", matched);
      console.log("新添加關鍵字:", unmatched);

      setMatchedData(matched);
      setUnmatchedData(unmatched);
      setShow(true);
      closeReturnModal();
      setSelected([]);
    } catch (error) {
      console.error("資料比對時發生錯誤: ", error);
    }
  };



  const handleDelete = async () => {
    try {
      if (selected.length === 0) {
        console.error("未選擇任何資料");
        return;
      }

      const idToDelete = selected[0]; 

      // 更新統計數據 (如果需要的話)
      await updateStatistics(); 
      await updatetopType(); 

      await deleteDoc(doc(db, "Report", idToDelete));
      console.log(`已從 Report 資料表刪除文檔 ID: ${idToDelete}`);
      
      // We don't need to manually update state here anymore since the real-time listener will handle it
      setSelected([]);
      console.log("刪除成功");
      closeReturnModal();
    } catch (error) {
      console.error("刪除失敗: ", error);
      alert(`刪除失敗: ${error.message}`);
    }
  };

  const handleClose = () => {
    setShow(false);
    setMatchedData([]);
    setUnmatchedData([]);
  };

  return (
    <>
      <Box sx={{ width: "100%" }} className="MuiBox-root css-8atqhb">
        <Paper sx={{ width: "100%", mb: 2 }} className="none">
          <div className="relative-position">
            <EnhancedTableToolbar
              numSelected={selected.length}
              openUpdateModal={openUpdateModal}
              openDeleteModal={openDeleteModal}
              handleCheckFraud={handleCheckFraud}
              openEditModal={openEditModal}
            />
          </div>
          <TableContainer className="full-width">
            <Table 
              sx={{ width: '100%', minWidth: '100%' }} 
              aria-labelledby="tableTitle" 
              className="admin-table"
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
              />
              <TableBody>
                {visibleRows.map((row, index) => {
                  const isItemSelected = selected.indexOf(row.id) !== -1;
                  const labelId = `enhanced-table-checkbox-${index}`;
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                      className="full-width"
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          onClick={(event) => handleClick(event, row.id)}
                          checked={isItemSelected}
                          inputProps={{
                            "aria-labelledby": labelId,
                          }}
                        />
                      </TableCell>
                      <TableCell align="left" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">
                        {row.FileIcon ? row.FileIcon : ''} {row.Report}
                      </TableCell>
                      <TableCell align="left" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.Source}</TableCell>
                      <TableCell align="left" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.AddNote}</TableCell>
                      <TableCell align="right" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.FraudResult}</TableCell>
                      <TableCell align="right" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.MatchKeyword}</TableCell>
                      <TableCell align="right" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.MatchType}</TableCell>
                      <TableCell align="right" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.FraudRate}</TableCell>
                      <TableCell align="right" className="MuiTableCell-root MuiTableCell-body MuiTableCell-alignRight MuiTableCell-sizeMedium css-3ssuu9-MuiTableCell-root">{row.ShortVideo}</TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="顯示筆數："
            labelDisplayedRows={({ from, to, count }) =>
              `第 ${from} 至 ${to} 筆，共 ${count} 筆`
            }
          />
        </Paper>
      </Box>

      {/* 更新結果 Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <p className="update-result-title">
              更新結果
            </p>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-left-margin">
          <div>
            <p className="adminpreview-updatecheck">重複：</p>
            <div className="adminupdate-text">
              {matchedData.length > 0 ? (
                matchedData
                  .map((item) =>
                    item.Match.map((match) => match.MatchKeyword).join(", ")
                  )
                  .join(", ")
              ) : (
                <p className="adminupdate-text">無關鍵字重複</p>
              )}
            </div>
          </div>
          <div>
            <p className="adminpreview-updatecheck updatecheck-mt">更新：</p>
            <div className="adminupdate-text">
              {unmatchedData.length > 0 ? (
                unmatchedData
                  .map((item) =>
                    item.Match.map((match) => match.MatchKeyword).join(", ")
                  )
                  .join(", ")
              ) : (
                <p className="adminupdate-text">無關鍵字被更新</p>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal-center-footer">
          <button
            className="admin-enter"
            onClick={handleClose}
          >
            確認
          </button>
        </Modal.Footer>
      </Modal>

      {/* 更新或刪除確認 Modal */}
      {(isUpdateModalOpen || isDeleteModalOpen) && ( 
        <div className="m-overlay">
          <div className="m-content">
            {isUpdateModalOpen ? (
              <CloudUploadIcon className="icon-large" style={{fontSize:'80px'}}/>
            ) : (
              <DeleteIcon className="icon-large" style={{fontSize:'80px'}}/>
            )}
            <h4 className="m-title">
              {isUpdateModalOpen ? '是否確定要更新？' : '是否確定要刪除？'}
            </h4>
            <div className="admin-col-area">
              <button className="admin-enter" onClick={isUpdateModalOpen ? handleUpdate : handleDelete}>確認</button>
              <button className="admin-jumps" onClick={closeReturnModal}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯 Modal */}
      {isEditModalOpen && (
        <div className="m-overlay">
          <div className="m-content edit-modal-content">
            <div className="edit-modal-header">
              <h4 className="m-title edit-modal-title">編輯資料</h4>
              <IconButton onClick={closeReturnModal}>
                <CloseIcon />
              </IconButton>
            </div>
            <div className="edit-modal-body">
              <TextField
                label="回報內容"
                name="Report"
                value={editData.Report}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                variant="outlined"
                {...textFieldProps}
              />
              <TextField
                label="資料來源"
                name="Source"
                value={editData.Source}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                {...textFieldProps}
              />
              <TextField
                label="附註"
                name="AddNote"
                value={editData.AddNote}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                {...textFieldProps}
              />
              <TextField
                label="詐騙結果"
                name="FraudResult"
                value={editData.FraudResult}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                {...textFieldProps}
              />
              <TextField
                label="匹配關鍵字"
                name="MatchKeyword"
                value={editData.MatchKeyword}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                helperText="多個關鍵字請用逗號分隔"
                {...textFieldProps}
                {...textFieldHelperProps}
              />
              <TextField
                label="匹配類型"
                name="MatchType"
                value={editData.MatchType}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                helperText="多個類型請用逗號分隔"
                {...textFieldProps}
                {...textFieldHelperProps}
              />
              <TextField
                label="詐騙率"
                name="FraudRate"
                value={editData.FraudRate}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                {...textFieldProps}
              />
              <TextField
                label="短影音"
                name="ShortVideo"
                value={editData.ShortVideo}
                onChange={handleEditChange}
                fullWidth
                margin="normal"
                variant="outlined"
                type="string"
                inputProps={{ min: 0, max: 100 }}
                {...textFieldProps}
              />
            </div>
            <div className="edit-modal-footer">
              <button className="admin-enter" onClick={handleEditSubmit}>確認</button>
              <button className="admin-jumps" onClick={closeReturnModal}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* 詐騙檢測 Modal */}
      {isFraudCheckModalOpen && isLoading && (
        <div className="m-overlay">
          <div className="m-content fraud-check-modal">
            <CloseIcon 
              onClick={handleCloseCheck} 
              className="close-icon"
            />
            <div className="text-center-padding">
              <div className="bubblingG">
                <span id="bubblingG_1"></span>
                <span id="bubblingG_2"></span>
                <span id="bubblingG_3"></span>
              </div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <h4 className="m-title">正在進行詐騙檢測中...</h4>
            </div>
          </div>
        </div>
      )}
    </>
  );
}