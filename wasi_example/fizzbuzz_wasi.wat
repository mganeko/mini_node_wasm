(module
  ;; ---- builtin func imports ---
  ;; Import the required fd_write WASI function which will write the given io vectors to stdout
  ;; The function signature for fd_write is:
  ;; (File Descriptor, *iovs, iovs_len, nwritten) -> Returns number of bytes written
  (import "wasi_unstable" "fd_write" (func $fd_write (param i32 i32 i32 i32) (result i32)))

  ;; ---- export static string  ---
  (memory 1)
  (export "memory" (memory 0))
  (data (i32.const 0) "\00\00\00\00") ;; placeholder for nwritten - A place in memory to store the number of bytes written
  (data (i32.const 4) "\00\00\00\00") ;; placeholder for iov.iov_base (pointer to start of string)
  (data (i32.const 8) "\00\00\00\00") ;; placeholder for iovs_len (length of string)
  (data (i32.const 12) "hello world\n")  ;; 4--> iov.iov_base = 12, 4--> iov_len = 8, 12-->"hello ...":len=13
  (data (i32.const 512) "FizzBuzz\00")
  (data (i32.const 521) "Fizz\00")
  (data (i32.const 526) "Buzz\00")

  ;; ---- export main function  ---
  (export "_start" (func $main))
  (func $main
    (local $i i32)
    (local $ret i32)

    i32.const 1
    set_local $i

    loop ;; --begin of while loop--
      get_local $i
      i32.const 100
      i32.le_s
      if
        get_local $i
        call $fizzbuzz

        set_local $ret

        get_local $i
        i32.const 1
        i32.add

        set_local $i

        br 1 ;; --jump to head of while loop--
      end ;; end of if-then
    end ;; --end of while loop--
    i32.const 0
    drop
  )

  ;; --- user_defined functions ---
  (func $fizzbuzz (param $n i32) (result i32)
    get_local $n
    i32.const 3
    i32.const 5
    i32.mul

    i32.rem_s

    i32.const 0
    i32.eq

    if
      i32.const 512
      call $puts

      i32.const 15
      return

    else
      get_local $n
      i32.const 3
      i32.rem_s

      i32.const 0
      i32.eq

      if
        i32.const 521
        call $puts

        i32.const 3
        return

      else
        get_local $n
        i32.const 5
        i32.rem_s

        i32.const 0
        i32.eq

        if
          i32.const 526
          call $puts

          i32.const 5
          return

        else
          get_local $n
          call $putn

          get_local $n
          return

        end
      end
    end
    i32.const 88
    return
  )

;; builtin_func_template.watx
;;  - builtin function putn()/puts() for WASI

  ;; --- builtin functions ---
  (func $putn(param $n i32)
    (local $strLen i32)
    get_local $n
    call $_convI32ToString ;; ret=Lenght
    set_local $strLen

    ;; write tail LF
    i32.const 12 ;; head of string buffer
    get_local $strLen
    i32.add
    i32.const 10 ;; LF
    i32.store8 

    ;; +1 length for tail LF
    get_local $strLen
    i32.const 1
    i32.add
    set_local $strLen

    ;; iov.iov_base 
    i32.const 4
    i32.const 12
    i32.store

    ;; iov.iov_len
    i32.const 8
    get_local $strLen
    i32.store

    ;; $fd_write
    i32.const 1 ;; file_descriptor - 1 for stdout
    i32.const 4 ;; *iovs - The pointer to the iov array, which is stored at memory location 0
    i32.const 1 ;; iovs_len - We're printing 1 string stored in an iov - so one.
    i32.const 0 ;; nwritten - A place in memory to store the number of bytes writen
    call $fd_write

    drop ;; Discard the number of bytes written from the top the stack
  )

  (func $puts (param $n i32)
    (local $srcIdx i32)
    (local $destIdx i32)
    (local $len i32)
    (local $c i32)
    get_local $n
    set_local $srcIdx

    i32.const 0
    set_local $destIdx

    i32.const 0
    set_local $len

    get_local $srcIdx
    call $_loadChar

    set_local $c

    loop ;; --begin of while loop--
      get_local $c      
      if
        get_local $destIdx
        get_local $c
        call $_storeChar

        get_local $len
        i32.const 1
        i32.add

        set_local $len

        get_local $srcIdx
        i32.const 1
        i32.add

        set_local $srcIdx

        get_local $destIdx
        i32.const 1
        i32.add

        set_local $destIdx

        get_local $srcIdx
        call $_loadChar
        set_local $c

        ;; check lenght 255
        get_local $destIdx
        i32.const 255
        i32.lt_s
        br_if 1
        
        ;; br 1 ;; --jump to head of while loop--
      end ;; end of if-then
    end ;; --end of while loop--

    ;;get_local $len
    ;;call $putn

    ;; tail LF
    get_local $destIdx
    i32.const 10 ;; LF
    call $_storeChar

    get_local $len
    i32.const 1
    i32.add
    set_local $len

    ;; iov.iov_base 
    i32.const 4
    i32.const 12
    i32.store

    ;; iov.iov_len
    i32.const 8
    get_local $len
    i32.store


    ;; $fd_write
    i32.const 1 ;; file_descriptor - 1 for stdout
    i32.const 4 ;; *iovs - The pointer to the iov array, which is stored at memory location 0
    i32.const 1 ;; iovs_len - We're printing 1 string stored in an iov - so one.
    i32.const 0 ;; nwritten - A place in memory to store the number of bytes writen
    call $fd_write

    drop ;; Discard the number of bytes written from the top the stack 
  )

  ;; --- inner function ---
  (func $_calcLength (param $n i32) (result i32)
    (local $restValue i32)
    (local $len i32)
    get_local $n
    set_local $restValue

    i32.const 1
    set_local $len

    loop ;; --begin of while loop--
      get_local $restValue
      i32.const 10
      i32.ge_s
      if
        get_local $restValue
        i32.const 10
        i32.div_s

        set_local $restValue

        get_local $len
        i32.const 1
        i32.add

        set_local $len

        br 1 ;; --jump to head of while loop--
      end ;; end of if-then
    end ;; --end of while loop--
    get_local $len
    return

    ;;i32.const 88
    ;;return
  )

  (func $_getOneDigit (param $n i32) (result i32)
    (local $r i32)
    (local $c i32)
    get_local $n
    i32.const 10
    i32.rem_s

    set_local $r

    i32.const 48
    get_local $r
    i32.add

    set_local $c

    get_local $c
    return

    ;;i32.const 88
    ;;return
  )

  (func $_div10 (param $n i32) (result i32)
    (local $d i32)
    get_local $n
    i32.const 10
    i32.div_s

    set_local $d

    get_local $d
    return

    ;;i32.const 88
    ;;return
  )

  (func $_storeChar (param $idx i32) (param $charCode i32)
    get_local $idx
    i32.const 12 ;; start offset of string buffer
    i32.add

    get_local $charCode
    
    i32.store8

    ;; i32.const 88
    ;; return
  )

  (func $_isMinus (param $n i32) (result i32)
    get_local $n
    i32.const 0
    i32.lt_s

    if
      i32.const 1
      return
    end

    i32.const 0
    return

    ;;i32.const 88
    ;;return
  )

  (func $_convI32ToString (param $n i32) (result i32)
    (local $restValue i32)
    (local $isMinus i32)
    (local $len i32)
    (local $idx i32)
    (local $digitChar i32)
    get_local $n
    set_local $restValue

    i32.const 0
    set_local $isMinus

    get_local $n
    call $_isMinus

    if
      i32.const 0
      get_local $n
      i32.sub

      set_local $restValue

      i32.const 1
      set_local $isMinus

      i32.const 0
      i32.const 45
      call $_storeChar

    end

    get_local $restValue
    call $_calcLength
    set_local $len

    get_local $len
    i32.const 1
    i32.sub

    set_local $idx

    i32.const 0
    set_local $digitChar

    loop ;; --begin of while loop--
      get_local $idx
      i32.const 0
      i32.ge_s
      if
        get_local $restValue
        call $_getOneDigit

        set_local $digitChar

        get_local $idx
        get_local $isMinus
        i32.add

        get_local $digitChar
        call $_storeChar

        get_local $restValue
        call $_div10

        set_local $restValue

        get_local $idx
        i32.const 1
        i32.sub

        set_local $idx

        br 1 ;; --jump to head of while loop--
      end ;; end of if-then
    end ;; --end of while loop--

    get_local $len
    get_local $isMinus
    i32.add

    return
  )


  (func $_loadChar (param $idx i32) (result i32)
    get_local $idx
    i32.load8_u

    return
  )

  ;; --- builtin functions end ---

)