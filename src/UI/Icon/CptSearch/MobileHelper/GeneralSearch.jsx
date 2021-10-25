import React, { useState, useEffect, useRef } from 'react';
import {
  Button, Divider, Table
} from 'antd';
import PropTypes from 'prop-types';
import toastr from "customToastr";
import _ from 'lodash-es';
import Empty from 'Base/Empty';
import NOFondImgPath from './img/empty.png';
import style from './GeneralSearch.less';
import { AntdIcon, getModelKey } from '../../../utils/utils';
import CptSearcher from "../CptSearcher";
import GeneralSearchItem from './GeneralInputItem';
import { getComponentsByAttribute, getSubAttributesNames } from '../api';
import { ON_SEARCH_CPT } from "../../eventType";
// 初始条件
const initCondition = {
  key: 0,
  relation: 1,
  attribute: [],
  option: "==",
  content: ""
};

const tableAttribute = ["楼层", "系统", "房间"];
const tableAttributeObj = {
  "楼层": "floor",
  "系统": "system",
  "房间": "room"
};

// 获取层级
async function getCondition(viewer3D, attribute, callback, errCallback) {
  // 获取场景中modelKey
  const modelKeys = getModelKey(viewer3D);
  const param = {
    viewer3D,
    modelKeys,
    models: modelKeys,
    attribute,
  };
  const result = await getSubAttributesNames(viewer3D, param);
  if (result.statusText === "OK") {
    const attributes = result?.data.data;
    if (callback && typeof callback === 'function') {
      callback(attributes);
    }
  } else {
    console.debug('请求基础属性列表失败');
    if (errCallback && typeof errCallback === 'function') {
      errCallback();
    }
  }
}

// 表格字段
const columns = [
  {
    title: '构件名称',
    dataIndex: 'name',
    ellipsis: {
      showTitle: true
    },
    // width: 1,
    className: style.cell,
    render: (text, record) => `${record?.familyName ? `${record.familyName}: ` : ""}${text}${record?.originalId ? `[${record.originalId}]` : ''}`
  },
  {
    title: '类型',
    dataIndex: 'type',
    align: 'center',
    // width: 1,
    ellipsis: {
      showTitle: true
    },
    className: style.cell,
    render: (text) => text || '/'
  },
  {
    title: '构件Key',
    dataIndex: 'key',
    // width: 1,
    ellipsis: {
      showTitle: true
    },
    className: style.cell,
    render: (text) => text || '/'
  },
];
export default function GeneralSearch(props) {
  const {
    viewer3D, offline, handleModalHeight, ee, tabKeys
  } = props;
  const [cptName, setCptName] = useState('');
  const [cptType, setCptType] = useState('');
  const [cptTypeRelation, setCptTypeRelation] = useState(1);
  const [cptKey, setCptKey] = useState('');
  const [cptKeyRelation, setCptKeyRelation] = useState(1);

  const cptSearcher = useRef({});

  const [tableCustomColumns, setTableCustomColumns] = useState([
    {
      value: 'attribute',
      label: '自定义',
      isLeaf: false,
      children: null
    }
  ]);

  // 处理第一下级联菜单菜单框
  function initCascaderOptions(value) {
    const templist = [];
    if (value.length) {
      const temp = value.map(item => ({
        value: item,
        label: item,
        children: null,
        isLeaf: false,
        key: 'item',
      }));
      templist.push(...temp);
    }
    setTableCustomColumns(templist);
  }
  //  挂在后执行
  useEffect(() => {
    cptSearcher.current = new CptSearcher({
      viewer3D
    });
    if (!offline) {
      getCondition(viewer3D, 'attribute', initCascaderOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 表格数据
  const [tableData, setTableData] = useState([]);
  function handleTableData(data = []) {
    setTableData(data);
  }

  // 分页
  const [pagination, setPaination] = useState({
    current: 1,
    pageSize: 10,
    total: 1
  });
  function handlePagination(pageInfo) {
    setPaination({
      ...pagination,
      ...pageInfo,
    });
  }

  // 是否正在加载中
  const [loding, setLoding] = useState(false);
  const isLoding = () => setLoding(true);
  const loaded = () => setLoding(false);

  // 存储表格选中项
  const [selectedRows, setSelectedRows] = useState({
    selectedRowKeys: [],
    selectedRowItems: []
  });
  function handleTabSelect(selected) {
    const { selectedRowKeys, selectedRowItems } = selected;
    setSelectedRows({
      selectedRowKeys,
      selectedRowItems
    });
  }

  /**
   * 选择表中构件的回调函数
   * 处理构件在模型中的高亮效果
   */
  function onSelectComponent(keys, rows) {
    // 当前模型高亮的构件key
    const tempHighCptKey = viewer3D.getHighlightComponentsKey() || [];

    // 获取当前选择的构件key
    const currentSelectCptKey = selectedRows.selectedRowKeys;

    // 传进来的构件key数组长度不为0，需要考虑是增加了还是减少了
    if (keys.length) {
      // 减少了
      if (keys.length < currentSelectCptKey.length) {
        // 取消勾选的构件key
        const cancelSelectedCptKeys = currentSelectCptKey.filter(
          item => !keys.includes(item));
        const remainingHighLightCptKeys = tempHighCptKey.filter(
          _key => !cancelSelectedCptKeys.includes(_key));

        // 取消不勾选的构件的高亮
        viewer3D.closeHighlightComponentsByKey(cancelSelectedCptKeys);
        // 同步模型树中的节点高亮
        ee.emit(ON_SEARCH_CPT, remainingHighLightCptKeys);
      } else {
        // 增加了高亮的构件
        tempHighCptKey.push(...keys);
        // 去重
        const tempKeys = Array.from(new Set(tempHighCptKey));

        // 高亮模型中构件
        viewer3D.highlightComponentsByKey(tempKeys);

        // 同步模型树
        ee.emit(ON_SEARCH_CPT, tempKeys);
      }
    } else {
      // 获取取消选择的构件key后剩下下的构件key
      const tempCptKey = tempHighCptKey.filter(item => !currentSelectCptKey.includes(item));

      // 取消高亮的构件
      viewer3D.closeHighlightComponentsByKey(currentSelectCptKey);

      // 同步树中高亮的构件
      ee.emit(ON_SEARCH_CPT, tempCptKey);
    }
    handleTabSelect({
      selectedRowKeys: keys,
      selectedRowItems: rows
    });
  }

  // 表格选中配置
  const rowSelection = {
    selectedRowKeys: selectedRows.selectedRowKeys,
    onChange: (selectedKeys, tempRows) => {
      const currentItem = tempRows[tempRows.length - 1];
      if (currentItem?.primitives === 0) {
        toastr.info("所选构件为无几何结构，无法进行定位！", "", {
          target: `#${viewer3D.viewport}`
        });
      }
      onSelectComponent(selectedKeys, tempRows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.name === 'Disabled',
      name: record.name,
    }),
    preserveSelectedRowKeys: true,
  };

  /**
   * 定位构件
   */
  function onAdaptive() {
    const { selectedRowKeys, selectedRowItems } = selectedRows;
    if (
      selectedRowItems.length > 0
      && selectedRowItems.every(item => item.primitives === 0)
    ) {
      toastr.info("所选构件为无几何结构，无法进行定位！", "", {
        target: `#${viewer3D.viewport}`
      });
    }
    if (selectedRowKeys.length > 0) {
      viewer3D.highlightComponentsByKey(selectedRowKeys);
      viewer3D.adaptiveSizeByKey(selectedRowKeys);
    } else {
      toastr.error("请选择构件哦！", '', {
        target: `#${viewer3D.viewport}`
      });
    }
  }

  // 更多条件
  const [allCondition, setAllCondition] = useState([initCondition]);

  // 搜索前数据整理
  function handleSearchOption() {
    const tempCondition = {}; // 临时存储查询条件

    // 生成属性条件函数
    function genConditionItem(field, operator, content, logic) {
      return {
        "logic": logic === 2 ? "or" : "and",
        "field": field,
        "operator": operator,
        "value": content
      };
    }

    // 组装条件函数
    function assembleItem(field, operator, content, logic) {
      tempCondition[field] = {
        "operator": operator,
        "value": content,
        "logic": logic === 2 ? "or" : "and"
      };
    }

    // 处理构件名称
    if (cptName) {
      assembleItem('name', 'like', cptName, 1);
    }

    // 处理构件类型
    if (cptType) {
      assembleItem('type', 'like', cptType, cptTypeRelation);
    }

    // 处理构件key
    if (cptKey) {
      assembleItem('key', 'like', cptKey, cptKeyRelation);
    }

    // 更多条件
    allCondition.forEach(_item => {
      // clone 避免影响元数据。
      const item = _.cloneDeep(_item);
      // 如果输入条件存在
      if (item.attribute?.length > 1 && item.content) {
        // unshift attribute 字段
        if (item?.attribute[0] === 'attribute') {
          item.attribute.shift();
        }
        if (Array.isArray(tempCondition['attribute'])) {
          tempCondition['attribute'].push(genConditionItem(item.attribute.join("."), item.option, item.content, item.relation));
        } else {
          tempCondition['attribute'] = [genConditionItem(item.attribute.join("."), item.option, item.content, item.relation)];
        }
      } else if (item.attribute?.length === 1 && item.content) {
        assembleItem(item.attribute[0], item.option, item.content, item.relation);
      }
    });
    // eslint-disable-next-line consistent-return
    return tempCondition;
  }

  /**
   * 获取构件的所有属性
   * @param {string} name 构件名称
   * @param {string} type 构件类型
   * @param {string} key 构件key
   * @param {object} d 该构件的所有属性
   * @returns {object} item 构件的所有属性
   */
  function createData(name, type, key, d) {
    return {
      name,
      type,
      key,
      ...d,
    };
  }

  // 离线模式下的搜索
  function onSearch(data) {
    // 处理条件
    if (!Object.keys(data).length) return;
    const temp = {
      name: '',
      type: '',
      componentKey: ''
    };
    // eslint-disable-next-line no-restricted-syntax
    for (const item of Object.keys(data)) {
      switch (item) {
        case "name":
          temp.name = data[item].value;
          break;
        case "type":
          temp.type = data[item].value;
          break;
        case "key":
          temp.componentKey = data[item].value;
          break;
        default:
          break;
      }
    }
    const result = cptSearcher.current.query(temp)
      .map(d => createData(d.name, d.type, d.componentKey, d.allData));
    handleTableData(result);
  }

  /**
   * 常规搜索函数
   * @param {object} condition 搜索条件
   * @param {string} attributes 返回构件的属性
   * @param {number} pageNumber 当前页
   * @param {number} pageSize 每页条数
   * @param {function} callbackFunc 回调函数
   */
  async function customSearch(condition, attributes, pageNumber, pageSize = 10, callbackFunc) {
    const modelKeys = getModelKey(viewer3D);
    try {
      const result = await getComponentsByAttribute(
        viewer3D, modelKeys, condition, pageNumber, pageSize, attributes);
      if (callbackFunc && typeof callbackFunc === 'function') {
        callbackFunc(result);
      }
    } catch (error) {
      toastr.clear();
      toastr.error("搜索失败", "", {
        target: `#${viewer3D.viewport}`
      });
      console.error(error);
    }
  }

  //   搜索函数
  function generalSearch(pageNumber, pageSize = 10, isSearchBtn = false) {
    const condition = handleSearchOption();
    if (!Object.keys(condition).length) {
      toastr.warning("搜索条件不能为空哦！", '', {
        target: `#${viewer3D.viewport}`
      });
      return;
    }
    //  兼容离线模式
    if (offline) {
      handlePagination({
        current: 1,
        pageSize
      });
      onSearch(condition);
    } else {
      const attr = "";
      if (isSearchBtn) {
        toastr.info("搜索中，请稍后...", "", {
          target: `#${viewer3D.viewport}`,
          "progressBar": false,
        });
        onSelectComponent([], []);
      }

      //   设置加载
      isLoding();
      customSearch(condition, attr, pageNumber - 1, pageSize, (result) => {
        const { data } = result;
        setTimeout(() => toastr.clear(), 800);
        if (data.code === "SUCCESS") {
          const {
            content, number, size, totalElements
          } = data.data;
          if (Array.isArray(content)) {
            // 设置表格数据
            handleTableData(content);
            // 设置分页
            handlePagination({
              current: number + 1,
              pageSize: size,
              total: totalElements
            });
            // 取消加载
            loaded();
          } else {
            setTimeout(() => {
              if (!content) {
                toastr.error("找不到相应构件哦！", "", {
                  target: `#${viewer3D.viewport}`
                });
                // 更改表格内容
                handleTableData([]);
              } else {
                toastr.error("搜索失败，请稍后重新尝试!", "", {
                  target: `#${viewer3D.viewport}`
                });
              }
            }, 1200);
          }
        } else {
          toastr.clear();
          setTimeout(() => {
            toastr.error(data.message, "", {
              target: `#${viewer3D.viewport}`
            });
          }, 800);
        }
      });
    }
    loaded();
  }
  const [customColumns, setCustomColumns] = useState(columns);
  const [customTableAttr, setCustomTableAttr] = useState([]);

  //  处理表格属性
  function handleTableAttr(value) {
    if (!value) {
      setCustomColumns(columns);
      return;
    }
    const exColumns = value.map(item => {
      // 用户添加表格字段
      if (!tableAttribute.includes(item)) {
        const attrList = item.split(".");
        attrList.unshift("attribute");
        const label = attrList[attrList.length - 1];
        return {
          title: label,
          dataIndex: attrList,
          ellipsis: {
            showTitle: true
          },
          width: 1,
          className: style.cell,
          align: 'center',
          render: (text) => text || '/'
        };
      } else {
        return {
          title: item,
          dataIndex: tableAttributeObj[item],
          ellipsis: {
            showTitle: true
          },
          width: 1,
          className: style.cell,
          align: 'center',
          render: (text) => text || '/'
        };
      }
    });
    // 处理自定义属性
    setCustomColumns([...columns, ...exColumns]);
    setCustomTableAttr(value);
  }

  // 重置
  function reset() {
    // 重置更多条件
    setAllCondition([{ key: Date.parse(new Date()) }]);
    // 处理常规搜索框的输入
    setCptName("");
    setCptTypeRelation(1);
    setCptType("");
    setCptKey("");
    setCptKeyRelation(1);
  }

  //   设置modal的高度
  useEffect(() => {
    if (tabKeys === '2') {
      if (tableData.length) {
        handleModalHeight(tableData.length % 10 * 75);
      } else {
        handleModalHeight(300);
      }
    }
  }, [handleModalHeight, tableData, tabKeys]);

  // 挂载 and 卸载
  useEffect(() => () => {
    reset();
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  // 常规输入框
  const InputList = [
    {
      label: '构件名称',
      placeholder: '请输入构件名称',
      inputValue: cptName,
      handleVaule: content => setCptName(content),
      show: false,
      offline,
    },
    {
      label: '构件类型',
      placeholder: '请输入构件类型',
      inputValue: cptType,
      handleVaule: content => setCptType(content),
      relation: cptTypeRelation,
      handleRadio: (relation) => setCptTypeRelation(relation),
      show: !offline,
      offline,
    },
    {
      label: '构件Key',
      placeholder: '请输入构件Key',
      inputValue: cptKey,
      handleVaule: content => setCptKey(content),
      relation: cptKeyRelation,
      handleRadio: (relation) => setCptKeyRelation(relation),
      show: !offline,
      offline,
    },
  ];

  // 获取下级属性后的回调
  function callback(e, target) {
    if (e.length) {
      const temp = e.map(item => ({
        value: item,
        label: item,
        children: null,
        isLeaf: true,
      }));
      target.children = temp;
      target.loading = false;
    } else {
      target.children = null;
      target.loading = false;
      target.isLeaf = true;
    }

    setTableCustomColumns([...tableCustomColumns]);
  }

  /**
    * 处理表格字段列表
    * @param {array} value 级联数组
    */
  function handleTableCustomAttr(value) {
    if (!value.length) return;
    const tempKey = value.join(".");
    handleTableAttr([...customTableAttr, tempKey]);
  }

  // 处理动态加载级联属性数据
  const loadData = async selectedOptions => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    const tempAttr = selectedOptions.map(item => item.value) || [];
    if (tempAttr.length && tempAttr[0] !== "attribute") {
      tempAttr.unshift("attribute");
    }
    if (tempAttr.length) {
      // 处理属性
      getCondition(viewer3D, tempAttr.join('.'), (value) => callback(value, targetOption));
    }
  };

  return (
    <div className={style.container}>
      <div className={style.general}>
        {
          InputList.map(item => (
            <GeneralSearchItem
              key={item.label}
              {...item}
            />
          ))
        }
        <div className={style.optionContainer}>
          <Button size="small" type="" onClick={reset}>重置</Button>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              generalSearch(1, 10, true);
            }}
          >
            搜索
          </Button>
        </div>
      </div>
      {tableData.length ? (
        <div className={style.result}>
          <Divider style={{ background: 'rgba(86, 90, 91, 1)', margin: '10px 0' }} />
          <div className={style.tableInfo}>
            <span>
              搜索到
              <span className={style.totalNumber}>
                {offline ? tableData.length : pagination.total}
              </span>
              条构件信息
            </span>
            <span className={style.location} onClick={onAdaptive}>
              <AntdIcon type="iconposition" />
              <span className={style.locationText}>构件定位</span>
            </span>
          </div>

          {!offline ? (
            <Table
              rowSelection={{
                type: "checkbox",
                ...rowSelection,
              }}
              bordered
              columns={customColumns}
              dataSource={tableData}
              size="small"
              pagination={{
                ...pagination,
                onChange: (current, pageSize) => generalSearch(current, pageSize),
                showSizeChanger: true,
                showTotal: totalTemp => `共 ${totalTemp} 条 每页显示:`,
                showLessItems: true,
              }}
              scroll={{ y: "250px", x: 'max-content' }}
              loading={loding}
              className={style.customTable}
            />
          ) : (
            <Table
              rowSelection={{
                type: "checkbox",
                ...rowSelection,
              }}
              bordered
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                onChange: (current, pageSize) => {
                  handlePagination({
                    current,
                    pageSize,
                  });
                },
                showSizeChanger: true,
                showTotal: totalTemp => `共 ${totalTemp} 条 每页显示:`,
                showLessItems: true,
              }}
              columns={customColumns}
              dataSource={tableData}
              size="small"
              scroll={{ y: "250px" }}
              loading={loding}
              className={style.customTable}
            />
          )}
        </div>
      ) : (
        <Empty image={NOFondImgPath} imageStyle={{ width: 'auto', height: 'auto' }}>
          <div>暂无内容    </div>
        </Empty>
      )}
    </div>
  );
}

GeneralSearch.defaultProps = {
  offline: false,
};

GeneralSearch.propTypes = {
  viewer3D: PropTypes.object.isRequired,
  ee: PropTypes.object.isRequired,
  offline: PropTypes.bool,
  handleModalHeight: PropTypes.func.isRequired,
  tabKeys: PropTypes.string.isRequired,
};
