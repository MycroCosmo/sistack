> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-trace 실행 결과

상태: PARTIAL. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.

## 개요

업무사용자 등록은 입력·인증·검증 조건을 통과하면 식별자를 발급받고 저장한다.
외부 ID 생성기와 validator는 내부 구현을 확정하지 않고 등록 INSERT와 성공 forward를 구별한다.

## 동작 흐름

POST 등록 폼 → Controller 인증/외부 검증 → Service의 외부 ID 생성 → 로컬 비밀번호 변환 → DAO INSERT COMTNEMPLYRINFO → forward 도착 URL.

```text
src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:34
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:36
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:37
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_init
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_modal_setting
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_check
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_checkOk
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnIdCheck1
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#showModalDialogCallback
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnListPage
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnInsert
      └─ requests [CONFIRMED] → ANY /uss/umt/EgovUserInsert.do
         └─ maps_to [CONFIRMED] → egovframework.com.uss.umt.web.EgovUserManageController#insertUser
            └─ calls [CONFIRMED] → egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated
            └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191
            └─ calls [CONFIRMED] → egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser
               └─ calls [CONFIRMED] → egovframework.com.utl.sim.service.EgovFileScrty#encryptPassword
               └─ calls [CONFIRMED] → egovframework.com.utl.fcc.service.EgovStringUtil#isNullToString
               └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98
               └─ calls [CONFIRMED] → egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser
                  └─ executes [CONFIRMED] → userManageDAO.insertUser_S
                     └─ writes [CONFIRMED] → COMTNEMPLYRINFO
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_inqire_cert
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_dn_info_setting
└─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#dirname
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getActiveScript
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getContextPath
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#loadScript
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#fn_egov_ZipSearch
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#zipCallback
└─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#isArrayLike
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#Sizzle
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createCache
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#cache
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#markFunction
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#assert
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#addHandle
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#siblingCheck
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createInputPseudo
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createButtonPseudo
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createPositionalPseudo
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#testContext
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#setFilters
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#toSelector
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#addCombinator
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#elementMatcher
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#multipleContexts
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#condense
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#setMatcher
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromTokens
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromGroupMatchers
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#winnow
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#sibling
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createOptions
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#add
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#detach
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#completed
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#doScrollCheck
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#dataAttr
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#isEmptyDataObject
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#internalData
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#internalRemoveData
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#adjustCSS
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createSafeFragment
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#getAll
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#setGlobalEval
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#fixDefaultChecked
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#buildFragment
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#returnTrue
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#returnFalse
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#safeActiveElement
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#on
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#manipulationTarget
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#disableScript
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#restoreScript
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#cloneCopyEvent
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#fixCloneNodeIssues
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#domManip
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#remove
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#actualDisplay
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultDisplay
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#computeStyleTests
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#addGetHookIf
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#vendorPropName
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#showHide
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#setPositiveNumber
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#augmentWidthOrHeight
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#getWidthOrHeight
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#Tween
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createFxNow
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#genFx
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createTween
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultPrefilter
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#propFilter
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#Animation
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#getClass
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#addToPrefiltersOrTransports
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#inspectPrefiltersOrTransports
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#inspect
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxExtend
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxHandleResponses
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxConvert
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#done
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#getDisplay
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#filterHidden
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#buildParams
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createStandardXHR
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#createActiveXHR
   └─ includes [CONFIRMED] → src/main/webapp/js/egovframework/com/cmm/jquery.js#getWindow
└─ requests [CONFIRMED] → ANY /uss/umt/EgovUserInsert.do
```

```mermaid
flowchart TD
  n0["COMTNEMPLYRINFO"]
  n1["egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated"]
  n2["egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser"]
  n3["egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser"]
  n4["egovframework.com.uss.umt.web.EgovUserManageController#insertUser"]
  n5["egovframework.com.utl.fcc.service.EgovStringUtil#isNullToString"]
  n6["egovframework.com.utl.sim.service.EgovFileScrty#encryptPassword"]
  n7["userManageDAO.insertUser_S"]
  n8["src/main/webapp/js/egovframework/com/cmm/jquery.js"]
  n9["src/main/webapp/js/egovframework/com/cmm/jquery.js#isArrayLike"]
  n10["src/main/webapp/js/egovframework/com/cmm/jquery.js#Sizzle"]
  n11["src/main/webapp/js/egovframework/com/cmm/jquery.js#createCache"]
  n12["src/main/webapp/js/egovframework/com/cmm/jquery.js#cache"]
  n13["src/main/webapp/js/egovframework/com/cmm/jquery.js#markFunction"]
  n14["src/main/webapp/js/egovframework/com/cmm/jquery.js#assert"]
  n15["src/main/webapp/js/egovframework/com/cmm/jquery.js#addHandle"]
  n16["src/main/webapp/js/egovframework/com/cmm/jquery.js#siblingCheck"]
  n17["src/main/webapp/js/egovframework/com/cmm/jquery.js#createInputPseudo"]
  n18["src/main/webapp/js/egovframework/com/cmm/jquery.js#createButtonPseudo"]
  n19["src/main/webapp/js/egovframework/com/cmm/jquery.js#createPositionalPseudo"]
  n20["src/main/webapp/js/egovframework/com/cmm/jquery.js#testContext"]
  n21["src/main/webapp/js/egovframework/com/cmm/jquery.js#setFilters"]
  n22["src/main/webapp/js/egovframework/com/cmm/jquery.js#toSelector"]
  n23["src/main/webapp/js/egovframework/com/cmm/jquery.js#addCombinator"]
  n24["src/main/webapp/js/egovframework/com/cmm/jquery.js#elementMatcher"]
  n25["src/main/webapp/js/egovframework/com/cmm/jquery.js#multipleContexts"]
  n26["src/main/webapp/js/egovframework/com/cmm/jquery.js#condense"]
  n27["src/main/webapp/js/egovframework/com/cmm/jquery.js#setMatcher"]
  n28["src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromTokens"]
  n29["src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromGroupMatchers"]
  n30["src/main/webapp/js/egovframework/com/cmm/jquery.js#winnow"]
  n31["src/main/webapp/js/egovframework/com/cmm/jquery.js#sibling"]
  n32["src/main/webapp/js/egovframework/com/cmm/jquery.js#createOptions"]
  n33["src/main/webapp/js/egovframework/com/cmm/jquery.js#add"]
  n34["src/main/webapp/js/egovframework/com/cmm/jquery.js#detach"]
  n35["src/main/webapp/js/egovframework/com/cmm/jquery.js#completed"]
  n36["src/main/webapp/js/egovframework/com/cmm/jquery.js#doScrollCheck"]
  n37["src/main/webapp/js/egovframework/com/cmm/jquery.js#dataAttr"]
  n38["src/main/webapp/js/egovframework/com/cmm/jquery.js#isEmptyDataObject"]
  n39["src/main/webapp/js/egovframework/com/cmm/jquery.js#internalData"]
  n40["src/main/webapp/js/egovframework/com/cmm/jquery.js#internalRemoveData"]
  n41["src/main/webapp/js/egovframework/com/cmm/jquery.js#adjustCSS"]
  n42["src/main/webapp/js/egovframework/com/cmm/jquery.js#createSafeFragment"]
  n43["src/main/webapp/js/egovframework/com/cmm/jquery.js#getAll"]
  n44["src/main/webapp/js/egovframework/com/cmm/jquery.js#setGlobalEval"]
  n45["src/main/webapp/js/egovframework/com/cmm/jquery.js#fixDefaultChecked"]
  n46["src/main/webapp/js/egovframework/com/cmm/jquery.js#buildFragment"]
  n47["src/main/webapp/js/egovframework/com/cmm/jquery.js#returnTrue"]
  n48["src/main/webapp/js/egovframework/com/cmm/jquery.js#returnFalse"]
  n49["src/main/webapp/js/egovframework/com/cmm/jquery.js#safeActiveElement"]
  n50["src/main/webapp/js/egovframework/com/cmm/jquery.js#on"]
  n51["src/main/webapp/js/egovframework/com/cmm/jquery.js#manipulationTarget"]
  n52["src/main/webapp/js/egovframework/com/cmm/jquery.js#disableScript"]
  n53["src/main/webapp/js/egovframework/com/cmm/jquery.js#restoreScript"]
  n54["src/main/webapp/js/egovframework/com/cmm/jquery.js#cloneCopyEvent"]
  n55["src/main/webapp/js/egovframework/com/cmm/jquery.js#fixCloneNodeIssues"]
  n56["src/main/webapp/js/egovframework/com/cmm/jquery.js#domManip"]
  n57["src/main/webapp/js/egovframework/com/cmm/jquery.js#remove"]
  n58["src/main/webapp/js/egovframework/com/cmm/jquery.js#actualDisplay"]
  n59["src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultDisplay"]
  n60["src/main/webapp/js/egovframework/com/cmm/jquery.js#computeStyleTests"]
  n61["src/main/webapp/js/egovframework/com/cmm/jquery.js#addGetHookIf"]
  n62["src/main/webapp/js/egovframework/com/cmm/jquery.js#vendorPropName"]
  n63["src/main/webapp/js/egovframework/com/cmm/jquery.js#showHide"]
  n64["src/main/webapp/js/egovframework/com/cmm/jquery.js#setPositiveNumber"]
  n65["src/main/webapp/js/egovframework/com/cmm/jquery.js#augmentWidthOrHeight"]
  n66["src/main/webapp/js/egovframework/com/cmm/jquery.js#getWidthOrHeight"]
  n67["src/main/webapp/js/egovframework/com/cmm/jquery.js#Tween"]
  n68["src/main/webapp/js/egovframework/com/cmm/jquery.js#createFxNow"]
  n69["src/main/webapp/js/egovframework/com/cmm/jquery.js#genFx"]
  n70["src/main/webapp/js/egovframework/com/cmm/jquery.js#createTween"]
  n71["src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultPrefilter"]
  n72["src/main/webapp/js/egovframework/com/cmm/jquery.js#propFilter"]
  n73["src/main/webapp/js/egovframework/com/cmm/jquery.js#Animation"]
  n74["src/main/webapp/js/egovframework/com/cmm/jquery.js#getClass"]
  n75["src/main/webapp/js/egovframework/com/cmm/jquery.js#addToPrefiltersOrTransports"]
  n76["src/main/webapp/js/egovframework/com/cmm/jquery.js#inspectPrefiltersOrTransports"]
  n77["src/main/webapp/js/egovframework/com/cmm/jquery.js#inspect"]
  n78["src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxExtend"]
  n79["src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxHandleResponses"]
  n80["src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxConvert"]
  n81["src/main/webapp/js/egovframework/com/cmm/jquery.js#done"]
  n82["src/main/webapp/js/egovframework/com/cmm/jquery.js#getDisplay"]
  n83["src/main/webapp/js/egovframework/com/cmm/jquery.js#filterHidden"]
  n84["src/main/webapp/js/egovframework/com/cmm/jquery.js#buildParams"]
  n85["src/main/webapp/js/egovframework/com/cmm/jquery.js#createStandardXHR"]
  n86["src/main/webapp/js/egovframework/com/cmm/jquery.js#createActiveXHR"]
  n87["src/main/webapp/js/egovframework/com/cmm/jquery.js#getWindow"]
  n88["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js"]
  n89["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#dirname"]
  n90["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getActiveScript"]
  n91["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getContextPath"]
  n92["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#loadScript"]
  n93["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#fn_egov_ZipSearch"]
  n94["src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#zipCallback"]
  n95["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp"]
  n96["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:34"]
  n97["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:36"]
  n98["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:37"]
  n99["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38"]
  n100["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_init"]
  n101["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_modal_setting"]
  n102["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_check"]
  n103["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_checkOk"]
  n104["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnIdCheck1"]
  n105["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#showModalDialogCallback"]
  n106["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnListPage"]
  n107["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnInsert"]
  n108["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_inqire_cert"]
  n109["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_dn_info_setting"]
  n110["ANY /uss/umt/EgovUserInsert.do"]
  n111["external-injection:src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98"]
  n112["external-injection:src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191"]
  n95 -->|"includes CONFIRMED"| n96
  n95 -->|"includes CONFIRMED"| n97
  n95 -->|"includes CONFIRMED"| n98
  n95 -->|"includes CONFIRMED"| n99
  n95 -->|"includes CONFIRMED"| n88
  n95 -->|"includes CONFIRMED"| n8
  n95 -->|"requests CONFIRMED"| n110
  n99 -->|"includes CONFIRMED"| n100
  n99 -->|"includes CONFIRMED"| n101
  n99 -->|"includes CONFIRMED"| n102
  n99 -->|"includes CONFIRMED"| n103
  n99 -->|"includes CONFIRMED"| n104
  n99 -->|"includes CONFIRMED"| n105
  n99 -->|"includes CONFIRMED"| n106
  n99 -->|"includes CONFIRMED"| n107
  n99 -->|"includes CONFIRMED"| n108
  n99 -->|"includes CONFIRMED"| n109
  n88 -->|"includes CONFIRMED"| n89
  n88 -->|"includes CONFIRMED"| n90
  n88 -->|"includes CONFIRMED"| n91
  n88 -->|"includes CONFIRMED"| n92
  n88 -->|"includes CONFIRMED"| n93
  n88 -->|"includes CONFIRMED"| n94
  n8 -->|"includes CONFIRMED"| n9
  n8 -->|"includes CONFIRMED"| n10
  n8 -->|"includes CONFIRMED"| n11
  n8 -->|"includes CONFIRMED"| n12
  n8 -->|"includes CONFIRMED"| n13
  n8 -->|"includes CONFIRMED"| n14
  n8 -->|"includes CONFIRMED"| n15
  n8 -->|"includes CONFIRMED"| n16
  n8 -->|"includes CONFIRMED"| n17
  n8 -->|"includes CONFIRMED"| n18
  n8 -->|"includes CONFIRMED"| n19
  n8 -->|"includes CONFIRMED"| n20
  n8 -->|"includes CONFIRMED"| n21
  n8 -->|"includes CONFIRMED"| n22
  n8 -->|"includes CONFIRMED"| n23
  n8 -->|"includes CONFIRMED"| n24
  n8 -->|"includes CONFIRMED"| n25
  n8 -->|"includes CONFIRMED"| n26
  n8 -->|"includes CONFIRMED"| n27
  n8 -->|"includes CONFIRMED"| n28
  n8 -->|"includes CONFIRMED"| n29
  n8 -->|"includes CONFIRMED"| n30
  n8 -->|"includes CONFIRMED"| n31
  n8 -->|"includes CONFIRMED"| n32
  n8 -->|"includes CONFIRMED"| n33
  n8 -->|"includes CONFIRMED"| n34
  n8 -->|"includes CONFIRMED"| n35
  n8 -->|"includes CONFIRMED"| n36
  n8 -->|"includes CONFIRMED"| n37
  n8 -->|"includes CONFIRMED"| n38
  n8 -->|"includes CONFIRMED"| n39
  n8 -->|"includes CONFIRMED"| n40
  n8 -->|"includes CONFIRMED"| n41
  n8 -->|"includes CONFIRMED"| n42
  n8 -->|"includes CONFIRMED"| n43
  n8 -->|"includes CONFIRMED"| n44
  n8 -->|"includes CONFIRMED"| n45
  n8 -->|"includes CONFIRMED"| n46
  n8 -->|"includes CONFIRMED"| n47
  n8 -->|"includes CONFIRMED"| n48
  n8 -->|"includes CONFIRMED"| n49
  n8 -->|"includes CONFIRMED"| n50
  n8 -->|"includes CONFIRMED"| n51
  n8 -->|"includes CONFIRMED"| n52
  n8 -->|"includes CONFIRMED"| n53
  n8 -->|"includes CONFIRMED"| n54
  n8 -->|"includes CONFIRMED"| n55
  n8 -->|"includes CONFIRMED"| n56
  n8 -->|"includes CONFIRMED"| n57
  n8 -->|"includes CONFIRMED"| n58
  n8 -->|"includes CONFIRMED"| n59
  n8 -->|"includes CONFIRMED"| n60
  n8 -->|"includes CONFIRMED"| n61
  n8 -->|"includes CONFIRMED"| n62
  n8 -->|"includes CONFIRMED"| n63
  n8 -->|"includes CONFIRMED"| n64
  n8 -->|"includes CONFIRMED"| n65
  n8 -->|"includes CONFIRMED"| n66
  n8 -->|"includes CONFIRMED"| n67
  n8 -->|"includes CONFIRMED"| n68
  n8 -->|"includes CONFIRMED"| n69
  n8 -->|"includes CONFIRMED"| n70
  n8 -->|"includes CONFIRMED"| n71
  n8 -->|"includes CONFIRMED"| n72
  n8 -->|"includes CONFIRMED"| n73
  n8 -->|"includes CONFIRMED"| n74
  n8 -->|"includes CONFIRMED"| n75
  n8 -->|"includes CONFIRMED"| n76
  n8 -->|"includes CONFIRMED"| n77
  n8 -->|"includes CONFIRMED"| n78
  n8 -->|"includes CONFIRMED"| n79
  n8 -->|"includes CONFIRMED"| n80
  n8 -->|"includes CONFIRMED"| n81
  n8 -->|"includes CONFIRMED"| n82
  n8 -->|"includes CONFIRMED"| n83
  n8 -->|"includes CONFIRMED"| n84
  n8 -->|"includes CONFIRMED"| n85
  n8 -->|"includes CONFIRMED"| n86
  n8 -->|"includes CONFIRMED"| n87
  n110 -->|"maps_to CONFIRMED"| n4
  n107 -->|"requests CONFIRMED"| n110
  n4 -->|"calls CONFIRMED"| n1
  n4 -->|"calls UNRESOLVED"| n112
  n4 -->|"calls CONFIRMED"| n2
  n2 -->|"calls CONFIRMED"| n6
  n2 -->|"calls CONFIRMED"| n5
  n2 -->|"calls UNRESOLVED"| n111
  n2 -->|"calls CONFIRMED"| n3
  n3 -->|"executes CONFIRMED"| n7
  n7 -->|"writes CONFIRMED"| n0
```

## 파일 위치

| 계층 | 위치 | 이름 |
|---|---|---|
| table | `script/ddl/altibase/com_DDL_altibase.sql:129` | COMTNEMPLYRINFO |
| method | `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58` | egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated |
| method | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:96` | egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser |
| method | `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:55` | egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser |
| method | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:183` | egovframework.com.uss.umt.web.EgovUserManageController#insertUser |
| method | `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:371` | egovframework.com.utl.fcc.service.EgovStringUtil#isNullToString |
| method | `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:198` | egovframework.com.utl.sim.service.EgovFileScrty#encryptPassword |
| sql | `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74` | userManageDAO.insertUser_S |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1` | src/main/webapp/js/egovframework/com/cmm/jquery.js |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:563` | src/main/webapp/js/egovframework/com/cmm/jquery.js#isArrayLike |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:772` | src/main/webapp/js/egovframework/com/cmm/jquery.js#Sizzle |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:912` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createCache |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:915` | src/main/webapp/js/egovframework/com/cmm/jquery.js#cache |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:930` | src/main/webapp/js/egovframework/com/cmm/jquery.js#markFunction |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:939` | src/main/webapp/js/egovframework/com/cmm/jquery.js#assert |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:961` | src/main/webapp/js/egovframework/com/cmm/jquery.js#addHandle |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:976` | src/main/webapp/js/egovframework/com/cmm/jquery.js#siblingCheck |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1003` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createInputPseudo |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1014` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createButtonPseudo |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1025` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createPositionalPseudo |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1048` | src/main/webapp/js/egovframework/com/cmm/jquery.js#testContext |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2093` | src/main/webapp/js/egovframework/com/cmm/jquery.js#setFilters |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2164` | src/main/webapp/js/egovframework/com/cmm/jquery.js#toSelector |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2174` | src/main/webapp/js/egovframework/com/cmm/jquery.js#addCombinator |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2232` | src/main/webapp/js/egovframework/com/cmm/jquery.js#elementMatcher |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2246` | src/main/webapp/js/egovframework/com/cmm/jquery.js#multipleContexts |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2255` | src/main/webapp/js/egovframework/com/cmm/jquery.js#condense |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2276` | src/main/webapp/js/egovframework/com/cmm/jquery.js#setMatcher |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2369` | src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromTokens |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2427` | src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromGroupMatchers |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:2765` | src/main/webapp/js/egovframework/com/cmm/jquery.js#winnow |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3078` | src/main/webapp/js/egovframework/com/cmm/jquery.js#sibling |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3159` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createOptions |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3276` | src/main/webapp/js/egovframework/com/cmm/jquery.js#add |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3595` | src/main/webapp/js/egovframework/com/cmm/jquery.js#detach |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3609` | src/main/webapp/js/egovframework/com/cmm/jquery.js#completed |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3663` | src/main/webapp/js/egovframework/com/cmm/jquery.js#doScrollCheck |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3779` | src/main/webapp/js/egovframework/com/cmm/jquery.js#dataAttr |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3813` | src/main/webapp/js/egovframework/com/cmm/jquery.js#isEmptyDataObject |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3829` | src/main/webapp/js/egovframework/com/cmm/jquery.js#internalData |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:3921` | src/main/webapp/js/egovframework/com/cmm/jquery.js#internalRemoveData |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4314` | src/main/webapp/js/egovframework/com/cmm/jquery.js#adjustCSS |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4444` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createSafeFragment |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4548` | src/main/webapp/js/egovframework/com/cmm/jquery.js#getAll |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4577` | src/main/webapp/js/egovframework/com/cmm/jquery.js#setGlobalEval |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4593` | src/main/webapp/js/egovframework/com/cmm/jquery.js#fixDefaultChecked |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4599` | src/main/webapp/js/egovframework/com/cmm/jquery.js#buildFragment |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4759` | src/main/webapp/js/egovframework/com/cmm/jquery.js#returnTrue |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4763` | src/main/webapp/js/egovframework/com/cmm/jquery.js#returnFalse |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4769` | src/main/webapp/js/egovframework/com/cmm/jquery.js#safeActiveElement |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:4775` | src/main/webapp/js/egovframework/com/cmm/jquery.js#on |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:5890` | src/main/webapp/js/egovframework/com/cmm/jquery.js#manipulationTarget |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:5900` | src/main/webapp/js/egovframework/com/cmm/jquery.js#disableScript |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:5904` | src/main/webapp/js/egovframework/com/cmm/jquery.js#restoreScript |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:5914` | src/main/webapp/js/egovframework/com/cmm/jquery.js#cloneCopyEvent |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:5941` | src/main/webapp/js/egovframework/com/cmm/jquery.js#fixCloneNodeIssues |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6009` | src/main/webapp/js/egovframework/com/cmm/jquery.js#domManip |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6106` | src/main/webapp/js/egovframework/com/cmm/jquery.js#remove |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6442` | src/main/webapp/js/egovframework/com/cmm/jquery.js#actualDisplay |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6458` | src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultDisplay |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6607` | src/main/webapp/js/egovframework/com/cmm/jquery.js#computeStyleTests |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6819` | src/main/webapp/js/egovframework/com/cmm/jquery.js#addGetHookIf |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6862` | src/main/webapp/js/egovframework/com/cmm/jquery.js#vendorPropName |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6881` | src/main/webapp/js/egovframework/com/cmm/jquery.js#showHide |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6938` | src/main/webapp/js/egovframework/com/cmm/jquery.js#setPositiveNumber |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6947` | src/main/webapp/js/egovframework/com/cmm/jquery.js#augmentWidthOrHeight |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:6991` | src/main/webapp/js/egovframework/com/cmm/jquery.js#getWidthOrHeight |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7374` | src/main/webapp/js/egovframework/com/cmm/jquery.js#Tween |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7498` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createFxNow |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7506` | src/main/webapp/js/egovframework/com/cmm/jquery.js#genFx |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7526` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createTween |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7540` | src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultPrefilter |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7685` | src/main/webapp/js/egovframework/com/cmm/jquery.js#propFilter |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:7722` | src/main/webapp/js/egovframework/com/cmm/jquery.js#Animation |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:8803` | src/main/webapp/js/egovframework/com/cmm/jquery.js#getClass |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9115` | src/main/webapp/js/egovframework/com/cmm/jquery.js#addToPrefiltersOrTransports |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9149` | src/main/webapp/js/egovframework/com/cmm/jquery.js#inspectPrefiltersOrTransports |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9154` | src/main/webapp/js/egovframework/com/cmm/jquery.js#inspect |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9178` | src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxExtend |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9198` | src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxHandleResponses |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9255` | src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxConvert |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9753` | src/main/webapp/js/egovframework/com/cmm/jquery.js#done |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9985` | src/main/webapp/js/egovframework/com/cmm/jquery.js#getDisplay |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:9989` | src/main/webapp/js/egovframework/com/cmm/jquery.js#filterHidden |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:10027` | src/main/webapp/js/egovframework/com/cmm/jquery.js#buildParams |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:10346` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createStandardXHR |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:10352` | src/main/webapp/js/egovframework/com/cmm/jquery.js#createActiveXHR |
| js | `src/main/webapp/js/egovframework/com/cmm/jquery.js:10682` | src/main/webapp/js/egovframework/com/cmm/jquery.js#getWindow |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:14` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#dirname |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:20` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getActiveScript |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:30` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getContextPath |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:41` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#loadScript |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:75` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#fn_egov_ZipSearch |
| js | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:103` | src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#zipCallback |
| jsp | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:1` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:34` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:34 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:36` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:36 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:37` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:37 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:42` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_init |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:51` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_modal_setting |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:86` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_check |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:112` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_checkOk |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:136` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnIdCheck1 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:148` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#showModalDialogCallback |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:154` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnListPage |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:159` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnInsert |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:172` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_inqire_cert |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:187` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_dn_info_setting |
| endpoint | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182` | ANY /uss/umt/EgovUserInsert.do |
| unknown | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98` | external-injection:src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98 |
| unknown | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191` | external-injection:src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191 |

## 연결 근거

| 출발 → 도착 | 관계·상태 | 소스 근거 |
|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:34 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:34` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:36 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:36` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:37 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:37` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:36`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → src/main/webapp/js/egovframework/com/cmm/jquery.js | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:37`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:1` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp → ANY /uss/umt/EgovUserInsert.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:209`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_init | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:42` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_modal_setting | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:51` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_check | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:86` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_checkOk | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:112` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnIdCheck1 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:136` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#showModalDialogCallback | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:148` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnListPage | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:154` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnInsert | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:159` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_inqire_cert | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:172` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#inline:38 → src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_egov_dn_info_setting | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:38`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:187` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#dirname | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:14` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getActiveScript | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:20` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#getContextPath | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:30` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#loadScript | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:41` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#fn_egov_ZipSearch | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:75` |
| src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js → src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js#zipCallback | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:1`, `src/main/webapp/js/egovframework/com/sym/ccm/zip/EgovZipPopup.js:103` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#isArrayLike | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:563` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#Sizzle | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:772` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createCache | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:912` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#cache | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:915` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#markFunction | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:930` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#assert | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:939` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#addHandle | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:961` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#siblingCheck | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:976` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createInputPseudo | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:1003` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createButtonPseudo | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:1014` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createPositionalPseudo | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:1025` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#testContext | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:1048` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#setFilters | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2093` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#toSelector | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2164` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#addCombinator | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2174` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#elementMatcher | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2232` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#multipleContexts | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2246` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#condense | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2255` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#setMatcher | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2276` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromTokens | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2369` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#matcherFromGroupMatchers | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2427` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#winnow | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:2765` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#sibling | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3078` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createOptions | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3159` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#add | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3276` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#detach | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3595` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#completed | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3609` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#doScrollCheck | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3663` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#dataAttr | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3779` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#isEmptyDataObject | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3813` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#internalData | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3829` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#internalRemoveData | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:3921` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#adjustCSS | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4314` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createSafeFragment | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4444` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#getAll | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4548` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#setGlobalEval | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4577` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#fixDefaultChecked | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4593` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#buildFragment | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4599` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#returnTrue | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4759` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#returnFalse | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4763` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#safeActiveElement | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4769` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#on | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:4775` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#manipulationTarget | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:5890` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#disableScript | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:5900` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#restoreScript | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:5904` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#cloneCopyEvent | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:5914` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#fixCloneNodeIssues | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:5941` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#domManip | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6009` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#remove | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6106` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#actualDisplay | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6442` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultDisplay | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6458` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#computeStyleTests | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6607` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#addGetHookIf | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6819` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#vendorPropName | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6862` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#showHide | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6881` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#setPositiveNumber | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6938` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#augmentWidthOrHeight | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6947` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#getWidthOrHeight | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:6991` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#Tween | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7374` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createFxNow | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7498` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#genFx | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7506` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createTween | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7526` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#defaultPrefilter | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7540` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#propFilter | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7685` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#Animation | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:7722` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#getClass | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:8803` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#addToPrefiltersOrTransports | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9115` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#inspectPrefiltersOrTransports | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9149` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#inspect | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9154` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxExtend | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9178` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxHandleResponses | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9198` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#ajaxConvert | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9255` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#done | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9753` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#getDisplay | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9985` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#filterHidden | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:9989` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#buildParams | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:10027` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createStandardXHR | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:10346` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#createActiveXHR | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:10352` |
| src/main/webapp/js/egovframework/com/cmm/jquery.js → src/main/webapp/js/egovframework/com/cmm/jquery.js#getWindow | includes / CONFIRMED | `src/main/webapp/js/egovframework/com/cmm/jquery.js:1`, `src/main/webapp/js/egovframework/com/cmm/jquery.js:10682` |
| ANY /uss/umt/EgovUserInsert.do → egovframework.com.uss.umt.web.EgovUserManageController#insertUser | maps_to / CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:183`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:57` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fnInsert → ANY /uss/umt/EgovUserInsert.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:166`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:209` |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser → egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated | calls / CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:186`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58` |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser → external-injection:src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191 | calls / UNRESOLVED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191` |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser → egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | calls / CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:96`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:61` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser → egovframework.com.utl.sim.service.EgovFileScrty#encryptPassword | calls / CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:198` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser → egovframework.com.utl.fcc.service.EgovStringUtil#isNullToString | calls / CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:371` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser → external-injection:src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98 | calls / UNRESOLVED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser → egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser | calls / CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:103`, `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:55`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:41` |
| egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser → userManageDAO.insertUser_S | executes / CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:56`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| userManageDAO.insertUser_S → COMTNEMPLYRINFO | writes / CONFIRMED | `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:76` |

## 관련 테이블

- 쓰기: COMTNEMPLYRINFO — CONFIRMED, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:76`

## 함정

- mysql-selection / CONFIRMED: DB 기본 선택은 mapperLocations + Globals.DbType=mysql이다. 다른 DB XML은 후보이며 서버 override는 미검증이다. (`src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20`)
- profile-boundary / UNRESOLVED: AuthenticInterceptor는 dummy 프로필 전용이다. 활성 프로필은 Java Listener의 런타임 계산이라 자동 확정하지 못했다. 후보 연결은 LIKELY, profile=dummy; active=미확정으로 유지한다. Globals.Auth=security는 기본값 근거이며 실제 기동·override·실행 순서는 미확인이다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:43`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`, `src/main/resources/egovframework/egovProps/globals.properties:26`)
- ddl-location / CONFIRMED: 골격 table/view의 Altibase DDL 위치는 이름 병합 대표 선언이다. 활성 mysql DDL 위치로 해석하지 않으며 선택된 mysql SQL과 별도 mysql DDL을 확인했다. (`script/ddl/mysql/com_DDL_mysql.sql:184`, `script/ddl/mysql/com_DDL_mysql.sql:598`, `script/ddl/mysql/com_DDL_mysql.sql:5050`)
- submit-condition / CONFIRMED: v2는 onSubmit을 HTML 속성 대소문자와 무관하게 읽고 fnInsert의 form.submit을 기본 등록 action에 CONFIRMED로 연결한다. 다른 함수 fnListPage의 목록 action과 섞지 않는다. confirm/validator/비밀번호 일치 조건은 원문에서 확인했다. (`src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:154`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:159`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:166`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:209`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:474`)
- authentication-and-validation-branches / CONFIRMED: 인증 실패는 index, 검증 실패는 등록 view로 반환하며 통과 시 빈 조직/그룹을 null로 바꾸고 Service를 호출한다. 외부 validator 구현·실제 결과는 미검증이다. (`src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:186`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:195`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`)
- auth-helper-boundary / UNRESOLVED: v2는 isAuthenticated 진입 호출을 CONFIRMED로 연결한다. Helper 내부의 프로필별 주입·외부 구현 실행은 보충 미확정 경계로 남긴다. (`src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:186`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:27`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:34`, `src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:36`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58`)
- id-generation-config / CONFIRMED: 외부 테이블형 ID 생성기는 COMTECOPSEQ, 논리 tableName USRCNFRM_ID, blockSize 10과 USRCNFRM_ 접두 전략을 사용하도록 설정돼 있다. Oracle 시퀀스 또는 확인된 SQL 실행으로 바꾸어 말하지 않는다. 세부 전략은 cipers=11, fillChar=0으로 확인했다. (`src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:5`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:8`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:13`)
- id-generator-sql-boundary / UNRESOLVED: 외부 ID 생성기 구현 소스가 없어 실제 SQL·락·DB 접근 빈도는 미확정이다. COMTECOPSEQ는 설정상 접근 후보이며 본 INSERT가 직접 읽고 쓰는 테이블과 합치지 않는다. (`src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:5`, `script/ddl/mysql/com_DDL_mysql.sql:5215`)
- password-transform / CONFIRMED: v2는 문자열 유틸(Object 인자→String 반환)과 encryptPassword(String,String) 단일 overload를 CONFIRMED로 연결한다. byte[] overload는 제외한다. 실제 입력·비밀번호·해시를 실행하거나 출력하지 않았다. (`src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:371`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:198`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:205`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:208`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:212`)
- mysql-selection / CONFIRMED: 등록 DAO sqlId는 기본 선택된 mysql의 INSERT COMTNEMPLYRINFO로 이어진다. 다른 DB는 후보이며 ID 생성 SQL과 구별한다. (`src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:56`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:76`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/egovProps/globals.properties:20`)
- success-forward / CONFIRMED: 성공 시 resultMsg를 설정하고 forward:/uss/umt/EgovUserManage.do까지 기록한다. 도착 후 목록·공통코드 SQL 및 실패 화면의 별도 AJAX는 본 등록 처리에서 제외한다. (`src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:203`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:205`)

## 숨은 경로 확인

- interceptor: UNRESOLVED — 기본 locale/web-log 선언은 확인했다. dummy 전용 AuthenticInterceptor의 활성 프로필·실행 순서는 미확정이다. 조건부 후보는 LIKELY와 이유를 유지하며 무조건 활성/제외로 확정하지 않는다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:44`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:43`)
- filter: CONFIRMED — Java initializer가 인코딩·security 조건·multipart·HTMLTag·session timeout 필터를 등록한다. 내부실행은 미검증이다. (`src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:66`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:98`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:149`)
- aop: CONFIRMED — transaction REQUIRED/Exception rollback, syslog/개인정보/예외 AOP 선언을 확인했다. 조건부 로그의 DB 접근을 본 업무 SQL과 합산하지 않는다. (`src/main/resources/egovframework/spring/com/context-transaction.xml:13`, `src/main/resources/egovframework/spring/com/context-syslogaop.xml:19`, `src/main/resources/egovframework/spring/com/context-privacylogaop.xml:24`, `src/main/resources/egovframework/spring/com/context-aspect.xml:8`)
- paging: NOT_FOUND — 선택한 등록/중복확인 본 메서드에서는 페이징이 없다. 등록 후 목록은 범위 밖이다.
- common-code: NOT_FOUND — 선택한 등록/중복확인 메서드 안에는 별도 공통코드 조회가 없다. 화면 준비/후속 목록은 범위 밖이다.
- exception: CONFIRMED — Service after-throwing AOP와 MVC 예외별 view mapping이 있다. 실제 예외 발생·응답은 실행하지 않았다. (`src/main/resources/egovframework/spring/com/context-aspect.xml:8`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:63`)

## 확정 못 한 경로

- egovframework.com.uss.umt.web.EgovUserManageController#insertUser → external-injection:src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser → external-injection:src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- 실제 앱·HTTP·DB 실행은 하지 않았다. 정적 소스 증거 2단계이며 외부 라이브러리·조건 참/거짓·서버 override는 미확정이다.
- v2는 승인된 사례를 본 뒤 일반 결함을 고친 확인 결과다. 일반화 성능으로 해석하지 않는다.
- 동적 Java profile 계산·복잡한 overload/가변인자·동적 URL/테이블은 자동 확정하지 않는다.

## 실행 방식

complex / parallel. 동일 모델의 화면/서버/SQL 탐색자가 초기 v2와 최종 v2-final 골격·원문을 실제 병렬 재확인했다.

## 다음 확인

- 자동 활성화 미실행 두 질문은 docs/manual-checks.md 절차로 확인한다.
- 학습 정답과 새 인증 Helper 호출의 차이는 source 근거와 함께 별도로 검토한다.
